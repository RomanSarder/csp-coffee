import { CreatableBufferType } from '@Lib/buffer';
import { makeChannel, close } from '@Lib/channel';
import { PutBuffer } from '@Lib/channel/entity/privateKeys';
import { filter, putAsync, takeAsync } from '@Lib/operators';
import { eventLoopQueue } from '@Lib/shared/utils';

describe('filter', () => {
    it('should return channel with filtered values from source channels', async () => {
        const ch1 = makeChannel<number>(CreatableBufferType.DROPPING, 2);
        const ch2 = makeChannel<string>(CreatableBufferType.DROPPING, 2);
        const { ch: ch3, promise } = filter(
            (num) => {
                if (typeof num === 'string') {
                    return parseInt(num, 10) % 2 === 0;
                }
                return num % 2 === 0;
            },
            [ch1, ch2],
        );

        await putAsync(ch1, 1);
        await putAsync(ch2, '2');
        expect(await takeAsync(ch3)).toEqual('2');
        await putAsync(ch2, '3');
        await putAsync(ch1, 4);
        expect(await takeAsync(ch3)).toEqual(4);
        close(ch1);
        close(ch2);
        close(ch3);
        await promise;
    });

    it('should return channel with specified configuration', async () => {
        const ch1 = makeChannel<number>(CreatableBufferType.DROPPING, 2);
        const { ch: ch2, promise } = filter(
            (num) => {
                if (typeof num === 'string') {
                    return parseInt(num, 10) % 2 === 0;
                }
                return num % 2 === 0;
            },
            [ch1],
            {
                bufferType: CreatableBufferType.SLIDING,
                capacity: 5,
            },
        );
        expect(ch2[PutBuffer].type).toEqual(CreatableBufferType.SLIDING);
        expect(ch2.capacity).toEqual(5);
        close(ch1);
        close(ch2);
        await promise;
    });

    describe('when the source channels close', () => {
        it('should close the result channel', async () => {
            const ch1 = makeChannel<number>(CreatableBufferType.DROPPING, 2);
            const ch2 = makeChannel<string>(CreatableBufferType.DROPPING, 2);
            const { ch: ch3, promise } = filter(
                (num) => {
                    if (typeof num === 'string') {
                        return parseInt(num, 10) % 2 === 0;
                    }
                    return num % 2 === 0;
                },
                [ch1, ch2],
            );
            close(ch1);
            await eventLoopQueue();
            expect(ch3.isClosed).toEqual(false);
            close(ch2);
            await promise;
            expect(ch3.isClosed).toEqual(true);
        });
    });
});
