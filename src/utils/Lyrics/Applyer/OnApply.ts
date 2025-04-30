import Global from "../../../components/Global/Global";

const EventPrefix = "lyrics:";

const EmitNotApplyed = () => {
    Global.Event.evoke(`${EventPrefix}not-apply`, null);
}

const EmitApply = (Type: string, Content: any) => {
    document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent")?.classList.remove("HiddenTransitioned");
    Global.Event.evoke(`${EventPrefix}apply`, { Type, Content });
};

export { EmitApply, EmitNotApplyed };