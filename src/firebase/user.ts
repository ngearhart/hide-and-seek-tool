import { useCurrentUser } from "vuefire";
import { getDatabase, ref as dbRef, set, get } from 'firebase/database';
import type { NullableUserRecord } from "@/utils";


export function useUserManager() {
    const user = useCurrentUser();

    const userRecordDbRef = computed(() => dbRef(getDatabase(), 'users/' + user.value?.uid));

    const save = async(user: NullableUserRecord) => {
        const userData = await get(userRecordDbRef.value);
        let existingUser = userData.val();

        await set(userRecordDbRef.value, {
            ...existingUser,
            ...user
        });
    }

    return { user, userRecordDbRef, save }
}
