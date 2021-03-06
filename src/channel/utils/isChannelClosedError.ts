import { errorMessages } from '../entity/errorMessages';

export function isChannelClosedError(e: unknown) {
    return e instanceof Error && e.message === errorMessages.CHANNEL_CLOSED;
}
