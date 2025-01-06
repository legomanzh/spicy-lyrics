interface Location {
    pathname: string;
    search?: string;
    hash?: string;
    state?: Record<string, any>;
};

let sessionHistory: Location[] = [];

const Session = {
    Navigate: (data: Location) => {
        Spicetify.Platform.History.push(data);
        //Session.PushToHistory(data);
    },
    GoBack: () => {
        if (sessionHistory.length > 1) {
            Session.Navigate(sessionHistory[sessionHistory.length - 2]);
        } else {
            Session.Navigate({ pathname: "/" })
        }
    },
    RecordNavigation: (data: Location) => {
        Session.PushToHistory(data);
    },
    FilterOutTheSameLocation: (data: Location) => {
        const filtered = sessionHistory.filter(location => location.pathname !== data.pathname && location.search !== data?.search && location.hash !== data?.hash);
        sessionHistory = filtered;
    },
    PushToHistory: (data: Location) => {
        sessionHistory.push(data);
    }
}

export default Session;