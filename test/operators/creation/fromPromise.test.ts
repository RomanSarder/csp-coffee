import { eventLoopQueue } from '@Lib/shared/utils';
import { fromPromise } from '@Lib/operators/creation/fromPromise';
import { takeAsync } from '@Lib/operators/core/takeAsync';

describe('fromPromise', () => {
    it('should create channel with promise result in it', async () => {
        const promise = Promise.resolve('test');
        const ch = fromPromise(promise);

        expect(await takeAsync(ch)).toEqual('test');
    });

    it('should close the channel when value is taken', async () => {
        const promise = Promise.resolve('test');
        const ch = fromPromise(promise);

        await takeAsync(ch);
        await eventLoopQueue();
        await eventLoopQueue();
        await eventLoopQueue();
        expect(ch.isClosed).toEqual(true);
    });
});
