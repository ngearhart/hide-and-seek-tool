import { getCurrentUser, useCurrentUser } from "vuefire"

const useCurrentUserMock = () => {
    if (window.location.origin == "http://localhost:3000") {
        return reactive({
            uid: "1wjds6prFGcoHULVaJbSlP9TI0O2",
            providerData: [{
                displayName: "Noah Gearhart"
            }]
        });
    } else {
        return useCurrentUser();
    }
}

const getCurrentUserMock = async() => {
    if (window.location.origin == "http://localhost:3000") {
        return reactive({
            uid: "1wjds6prFGcoHULVaJbSlP9TI0O2",
            providerData: [{
                displayName: "Noah Gearhart"
            }]
        });
    } else {
        const res = await getCurrentUser();
        return res;
    }
}

export {
    useCurrentUserMock,
    getCurrentUserMock
}