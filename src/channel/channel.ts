import { eventLoopQueue } from '@Lib/internal';
import { BufferType, makeBuffer } from '@Lib/buffer';
import { CreatableBufferTypes } from '@Lib/buffer/buffer.enum';
import type { Channel } from './channel.types';
import { events } from './constants';
import { close, take } from '../operators';

export function makeChannel<T = NonNullable<unknown>>(
    bufferType: CreatableBufferTypes = BufferType.FIXED,
    capacity = 1,
): Channel<T> {
    return {
        capacity,
        isBuffered: capacity > 1,
        isClosed: false,
        putBuffer: makeBuffer<T>(bufferType, capacity),
        takeBuffer: makeBuffer(BufferType.FIXED, 1),
        async *[Symbol.asyncIterator]() {
            while (!this.isClosed && this.putBuffer.getSize() <= capacity) {
                const result = (await take<T>(this)) as string | T;
                yield result;
                await eventLoopQueue();
            }

            return events.CHANNEL_CLOSED;
        },
    };
}

export function makeTimeoutChannel<T = NonNullable<unknown>>(
    ms: number,
    bufferType: CreatableBufferTypes = BufferType.FIXED,
    capacity = 1,
) {
    const ch = makeChannel<T>(bufferType, capacity);

    const timeout = setTimeout(() => {
        close(ch);
        clearTimeout(timeout);
    }, ms);

    return ch;
}
