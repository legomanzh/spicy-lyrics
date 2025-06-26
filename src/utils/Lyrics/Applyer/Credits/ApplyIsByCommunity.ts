

export function ApplyIsByCommunity(data: any, LyricsContainer: HTMLElement): void {
    if (!data.source || !LyricsContainer) return;

    if (data.source !== "spl") return;

    const songInfoElement = document.createElement("div");
    songInfoElement.classList.add("SongInfo");

    songInfoElement.innerHTML = `
        <span style="margin-bottom: 0.75cqw;">
            These lyrics have been provided by our community
        </span>
        ${
            (
                data.ttmlUploadsData &&
                data.ttmlUploadsData.Uploader &&
                data.ttmlUploadsData.Uploader.username &&
                data.ttmlUploadsData.Uploader.avatar
            ) ?
                `
                    <span class="Uploader">
                        <span>Uploaded${!data.ttmlUploadsData.Maker?.username ? " and Made" : ""} by <span style="font-weight: 700;">@${data.ttmlUploadsData.Uploader.username}</span></span>
                        ${data.ttmlUploadsData.Uploader.avatar ? `<img src="${data.ttmlUploadsData.Uploader.avatar}" alt="${data.ttmlUploadsData.Uploader.username}'s avatar" onerror="this.style.display='none';" />` : ``}
                    </span>
                `.trim()
            : ``
        }
        ${
            (
                data.ttmlUploadsData &&
                data.ttmlUploadsData.Maker &&
                data.ttmlUploadsData.Maker.username &&
                data.ttmlUploadsData.Maker.avatar
            ) ?
                `
                    <span class="Maker">
                        <span>Made by <span style="font-weight: 700;">@${data.ttmlUploadsData.Maker.username}</span></span>
                        ${data.ttmlUploadsData.Maker.avatar ? `<img src="${data.ttmlUploadsData.Maker.avatar}" alt="${data.ttmlUploadsData.Maker.username}'s avatar" onerror="this.style.display='none';" />` : ``}
                    </span>
                `.trim()
            : ``
        }
    `
    LyricsContainer.appendChild(songInfoElement);
}