import Animator from "../../utils/Animator";
import BlobURLMaker from "../../utils/BlobURLMaker";
import storage from "../../utils/storage";
import Defaults from "../Global/Defaults";
import { SpotifyPlayer } from "../Global/SpotifyPlayer";
import ArtistVisuals from "./ArtistVisuals/Main";
import * as THREE from "three";
import { GetShaderUniforms, VertexShader, FragmentShader, ShaderUniforms } from "./ThreeShaders";
import Global from "../Global/Global";
import Platform from "../Global/Platform";

// Add custom type for our container element
interface DynamicBGContainer extends HTMLElement {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    uniforms: ShaderUniforms;
    animationFrame?: number;
    resizeObserver?: ResizeObserver;
    texture?: THREE.Texture;
    material?: THREE.ShaderMaterial;
}

// Setup static THREE.js objects
const RenderCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
RenderCamera.position.z = 1;
const MeshGeometry = new THREE.PlaneGeometry(2, 2);

let previousRenderer: THREE.WebGLRenderer | null = null;
export const updateContainerDimensions = (container: DynamicBGContainer, width: number, height: number) => {
    const { renderer, scene, uniforms } = container;
        
    // Set size
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Update dimensions and uniforms
    const scaledWidth = (width * window.devicePixelRatio);
    const scaledHeight = (height * window.devicePixelRatio);
    
    const largestAxis = ((scaledWidth > scaledHeight) ? "X" : "Y");
    const largestAxisSize = ((scaledWidth > scaledHeight) ? scaledWidth : scaledHeight);

    uniforms.BackgroundCircleOrigin.value.set(scaledWidth / 2, scaledHeight / 2);
    uniforms.BackgroundCircleRadius.value = largestAxisSize * 1.5;
    uniforms.CenterCircleOrigin.value.set(scaledWidth / 2, scaledHeight / 2);
    uniforms.CenterCircleRadius.value = largestAxisSize * (largestAxis === "X" ? 1 : 0.75);
    uniforms.LeftCircleOrigin.value.set(0, scaledHeight);
    uniforms.LeftCircleRadius.value = largestAxisSize * 0.75;
    uniforms.RightCircleOrigin.value.set(scaledWidth, 0);
    uniforms.RightCircleRadius.value = largestAxisSize * (largestAxis === "X" ? 0.65 : 0.5);

    // Re-render scene
    renderer.render(scene, RenderCamera);
}

const lowQMode = storage.get("lowQMode");
const lowQModeEnabled = lowQMode && lowQMode === "true";

const cleanup = (container: DynamicBGContainer) => {
    if (container.animationFrame) {
        cancelAnimationFrame(container.animationFrame);
    }
    if (container.resizeObserver) {
        container.resizeObserver.disconnect();
    }
    if (container.texture) {
        container.texture.dispose();
    }
    if (container.material) {
        container.material.dispose();
    }
    if (container.renderer) {
        container.renderer.dispose();
        container.renderer.forceContextLoss();
        const gl = container.renderer.getContext();
        if (gl) {
            const loseContext = gl.getExtension('WEBGL_lose_context');
            if (loseContext) loseContext.loseContext();
        }
    }
    container.remove();
}

export default async function ApplyDynamicBackground(element: HTMLElement) {
    if (!element) return;
    let currentImgCover = Spicetify.Player.data?.item?.album?.images[3]?.url ?? Spicetify.Player.data?.item?.album?.images[2]?.url ?? Spicetify.Player.data?.item?.album?.images[1]?.url ?? Spicetify.Player.data?.item?.album?.images[0]?.url;
    const IsEpisode = Spicetify.Player.data.item.type === "episode";
    const CurrentSongArtist = IsEpisode ? null : Spicetify.Player.data?.item.artists[0].uri;
    const CurrentSongUri = Spicetify.Player.data?.item.uri;

    // Added Cleanup to the previous renderer
    if (previousRenderer) {
        previousRenderer.dispose();
        previousRenderer.forceContextLoss();
        previousRenderer = null;
    }

    if (lowQModeEnabled) {
        try {
            currentImgCover = (IsEpisode ? null : (storage.get("force-cover-bg_in-lowqmode") == "true" ? currentImgCover : await LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri)));
        } catch (error) {
            console.error("Error happened while trying to set the Low Quality Mode Dynamic Background", error);
        }

        if (IsEpisode) return;
        const dynamicBg = document.createElement("img");
        const prevBg = element.querySelector<HTMLElement>(".spicy-dynamic-bg.lowqmode");

        if (prevBg && prevBg.getAttribute("spotifyimageurl") === currentImgCover) {
            dynamicBg.remove();
            return;
        }

        dynamicBg.classList.add("spicy-dynamic-bg", "lowqmode");

        const processedCover = `https://i.scdn.co/image/${currentImgCover.replace("spotify:image:", "")}`;

        dynamicBg.src = await BlobURLMaker(processedCover) ?? currentImgCover;
        dynamicBg.setAttribute("spotifyimageurl", currentImgCover);
        element.appendChild(dynamicBg);

        if (Defaults.PrefersReducedMotion) {
            dynamicBg.style.opacity = "1";
            if (prevBg) prevBg.remove();
        } else {
            const Animator1 = new Animator(0, 1, 0.3);
            const Animator2 = new Animator(1, 0, 0.3);

            Animator1.on("progress", (progress) => {
                dynamicBg.style.opacity = progress.toString();
            });

            Animator2.on("progress", (progress) => {
                if (!prevBg) return;
                prevBg.style.opacity = progress.toString();
            });

            Animator1.on("finish", () => {
                dynamicBg.style.opacity = "1";
                Animator1.Destroy();
            });

            Animator2.on("finish", () => {
                prevBg?.remove();
                Animator2.Destroy();
            });

            Animator2.Start();
            Animator1.Start();
        }
    } else {
        let container = element.querySelector<DynamicBGContainer>(".spicy-dynamic-bg");
        const prevContainer = container;
        
        // If same song, do nothing
        if (container && container.getAttribute("data-cover-id") === currentImgCover) {
            return;
        }

        // Create new container
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        container = renderer.domElement as DynamicBGContainer;
        container.classList.add("spicy-dynamic-bg");
        container.style.opacity = "0"; // Start hidden for animation

        // Setup THREE.js scene
        const renderScene = new THREE.Scene();
        const materialUniforms = GetShaderUniforms();
        const meshMaterial = new THREE.ShaderMaterial({
            uniforms: materialUniforms,
            vertexShader: VertexShader,
            fragmentShader: FragmentShader,
        });
        container.material = meshMaterial;
        const sceneMesh = new THREE.Mesh(MeshGeometry, meshMaterial);
        renderScene.add(sceneMesh);

        // Store references on the container
        container.renderer = renderer;
        container.scene = renderScene;
        container.uniforms = materialUniforms;

        // Add to DOM
        element.appendChild(container);

        // Add resize observer
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const width = Math.max(entry.contentRect.width, 500);
                const height = Math.max(entry.contentRect.height, 500);
                updateContainerDimensions(container, width, height);
            }
        });
        container.resizeObserver = resizeObserver;
        resizeObserver.observe(element);

        // Update container attributes and initial size
        container.setAttribute("data-cover-id", currentImgCover);
        const width = Math.max(element.clientWidth, 500);
        const height = Math.max(element.clientHeight, 500);
        updateContainerDimensions(container, width, height);

        // Update texture
        const blurredCover = await GetBlurredCoverArt();
        const texture = new THREE.CanvasTexture(blurredCover);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        container.texture = texture;
        container.uniforms.BlurredCoverArt.value = texture;
        container.uniforms.RotationSpeed.value = 1.0;

        // Setup animation
        if (Defaults.PrefersReducedMotion) {
            container.style.opacity = "1";
            if (prevContainer) {
                cleanup(prevContainer);
            }
        } else {
            const fadeIn = new Animator(0, 1, 0.6);
            const fadeOut = new Animator(1, 0, 0.6);

            fadeIn.on("progress", (progress) => {
                container.style.opacity = progress.toString();
            });

            fadeOut.on("progress", (progress) => {
                if (prevContainer) {
                    prevContainer.style.opacity = progress.toString();
                }
            });

            fadeIn.on("finish", () => {
                container.style.opacity = "1";
                fadeIn.Destroy();
            });

            fadeOut.on("finish", () => {
                if (prevContainer) {
                    cleanup(prevContainer);
                }
                fadeOut.Destroy();
            });

            fadeOut.Start();
            fadeIn.Start();
        }

        // Start animation loop
        const animate = () => {
            container.uniforms.Time.value = performance.now() / 3500;
            container.renderer.render(container.scene, RenderCamera);
            container.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }
}

export async function LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri) {
    if (storage.get("force-cover-bg_in-lowqmode") == "true") return;
    try {
        return await ArtistVisuals.ApplyContent(CurrentSongArtist, CurrentSongUri);
    } catch (error) {
        console.error("Error happened while trying to set the Low Quality Mode Dynamic Background", error);
    }
}

const GetCoverArtURL = (): string | null => {
    const images = Spicetify.Player.data?.item?.album?.images;
    if (!images || images.length === 0) return null;
  
    for (const image of images) {
      const url = image.url;
      if (url) return url;
    }
    return null;
};

const BlurredCoverArts = new Map<string, OffscreenCanvas>();
export async function GetBlurredCoverArt() {
    const coverArt = GetCoverArtURL();

    if (BlurredCoverArts.has(coverArt)) {
        return BlurredCoverArts.get(coverArt);
    }

    const image = new Image();
    image.src = coverArt;
    await image.decode();

    const originalSize = Math.min(image.width, image.height); // Crop to a square
    const blurExtent = Math.ceil(3 * 40); // Blur spread extent

    // Create a square canvas to crop the image into a circle
    const circleCanvas = new OffscreenCanvas(originalSize, originalSize);
    const circleCtx = circleCanvas.getContext('2d')!;

    // Create circular clipping mask
    circleCtx.beginPath();
    circleCtx.arc(originalSize / 2, originalSize / 2, originalSize / 2, 0, Math.PI * 2);
    circleCtx.closePath();
    circleCtx.clip();

    // Draw the original image inside the circular clip
    circleCtx.drawImage(
        image,
        ((image.width - originalSize) / 2), ((image.height - originalSize) / 2),
        originalSize, originalSize,
        0, 0,
        originalSize, originalSize
    );

    // Expand canvas to accommodate blur effect
    const padding = (blurExtent * 1.5);
    const expandedSize = originalSize + padding;
    const blurredCanvas = new OffscreenCanvas(expandedSize, expandedSize);
    const blurredCtx = blurredCanvas.getContext('2d')!;

    blurredCtx.filter = `blur(${25}px)`;

    // Draw the cropped circular image in the center of the expanded canvas
    blurredCtx.drawImage(circleCanvas, (padding / 2), (padding / 2));

    BlurredCoverArts.set(coverArt, blurredCanvas);
    return blurredCanvas;
}

Global.Event.listen("playback:songchange", async () => {
    if (Defaults.LyricsContainerExists) return;
    setTimeout(async () => {
        await GetBlurredCoverArt();
    }, 500)
})

const prefetchBlurredCoverArt = async () =>{
    if (!Defaults.LyricsContainerExists) {
        await GetBlurredCoverArt();
    };
}

Platform.OnSpotifyReady
.then(() => {
    prefetchBlurredCoverArt();
})