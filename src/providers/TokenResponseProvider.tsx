import { createContext, Dispatch, PropsWithChildren, SetStateAction, useState } from 'react';

export interface Athlete {
    id: number,
    username: string,
    firstname: string,
    lastname: string,
    profile: string,
}

export interface TokenValue {
    expires_at: number,
    refresh_token: string,
    access_token: string,
    athlete: Athlete
}

export function createCtx<A>(defaultValue: A) {
    type UpdateType = Dispatch<SetStateAction<typeof defaultValue>>;
    const defaultUpdate: UpdateType = () => defaultValue;
    const ctx = createContext({
        state: defaultValue,
        update: defaultUpdate,
    });

    function Provider(props: PropsWithChildren<{}>) {
        const [state, update] = useState(defaultValue);
        return <ctx.Provider value={{ state, update }} {...props} />;
    }
    return [ctx, Provider] as const; // alternatively, [typeof ctx, typeof Provider]
}

