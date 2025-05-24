import { GetContainerHeight } from "../../Addons";
import { QueueForceScroll } from "../../Scrolling/ScrollToActiveLine";
import { ScrollSimplebar } from "../../Scrolling/Simplebar/ScrollSimplebar";

type LyricsContainerReturnObject = {
    Container: HTMLElement;
    ResizeListener: ResizeObserver;
    Append: (AppendTo: HTMLElement) => void;
    Remove: () => void;
    Resize: () => void;
};

const LyricsContainerInstances = new Map<number, LyricsContainerReturnObject>();

let lastMapIndex = -1;

const CreateLyricsContainer = (): LyricsContainerReturnObject => {
    const Container = document.createElement("div");
    Container.classList.add("SpicyLyricsScrollContainer");

    const Resize = () => {
        Container.style.height = `0px`;
        setTimeout(() => {
            const Height = GetContainerHeight(Container);
            Container.style.height = `${Height}px`;
            setTimeout(() => ScrollSimplebar?.recalculate(), 100)
            setTimeout(() => {
                Container.style.height = `0px`;
                setTimeout(() => {
                    const Height = GetContainerHeight(Container);
                    Container.style.height = `${Height}px`;
                    setTimeout(() => ScrollSimplebar?.recalculate(), 100)
                    QueueForceScroll();
                }, 110)
            }, 50)
        }, 150)
    }

    const ResizeListener = new ResizeObserver(() => {
        Resize();
    });

    const Remove = () => {
        ResizeListener.unobserve(Container.parentElement as HTMLElement);
        ResizeListener.disconnect();
        Container.remove();
        LyricsContainerInstances.delete(lastMapIndex)
    };

    const ReturnObject = {
        Container,
        ResizeListener,
        Append: (AppendTo: HTMLElement) => {
            AppendTo.appendChild(Container);
            Container.style.height = `${GetContainerHeight(Container)}px`;
            ResizeListener.observe(Container.parentElement as HTMLElement);
        },
        Remove,
        Resize
    };

    lastMapIndex += 1;

    LyricsContainerInstances.set(lastMapIndex, ReturnObject)

    return ReturnObject;
}

const GetCurrentLyricsContainerInstance = (): LyricsContainerReturnObject | undefined => {
    let currentInstance: LyricsContainerReturnObject | undefined = undefined;
    LyricsContainerInstances.forEach((ReturnObject, index, array) => {
        const isLast = array.size - 1 === index;
        if (isLast) {
            currentInstance = ReturnObject;
        }
    })
    return currentInstance ?? undefined;
}

const DestroyAllLyricsContainers = () => {
    LyricsContainerInstances.forEach(Instance => {
        Instance.Remove();
    })
}

export { CreateLyricsContainer, DestroyAllLyricsContainers, GetCurrentLyricsContainerInstance }