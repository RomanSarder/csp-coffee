import { FlattenChannel } from '@Lib/channel/entity/flatten';
import { Channel } from '@Lib/channel/entity/channel';

import { call } from '@Lib/go/instructions/call';
import { releasePut } from '../internal/releasePut';

export function pollFn<C extends Channel<any>>(
    ch: C,
): FlattenChannel<C> | null {
    if (!ch.isClosed && ch.putBuffer.getSize() > 0) {
        const maybeResult = releasePut(ch);
        return maybeResult || null;
    }
    return null;
}

export function poll<C extends Channel<any>>(ch: C) {
    return call(pollFn, ch);
}