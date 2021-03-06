import { BufferType, CreatableBufferType } from './entity/bufferType';
import { makeClosedBuffer } from './closedBuffer';
import { makeDroppingBuffer } from './droppingBuffer';
import { makeSlidingBuffer } from './slidingBuffer';
import type { Buffer } from './entity/buffer';
import { makeFixedBuffer } from './fixedBuffer';
import { makeUnblockingBuffer } from './unblockingBuffer';

const bufferTypeToMakeFn = {
    [BufferType.DROPPING]: makeDroppingBuffer,
    [BufferType.SLIDING]: makeSlidingBuffer,
    [BufferType.CLOSED]: makeClosedBuffer,
    [BufferType.FIXED]: makeFixedBuffer,
    [BufferType.UNBLOCKING]: makeUnblockingBuffer,
};

export function makeBuffer<T = unknown>(
    bufferType: BufferType | CreatableBufferType,
    capacity = 1,
): Buffer<T> {
    return {
        ...bufferTypeToMakeFn[bufferType]<T>(capacity),
    };
}
