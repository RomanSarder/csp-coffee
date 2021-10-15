import { BufferType } from '@Lib/buffer';
import * as channel from '@Lib/channel';
import { makeChannel, makePut, put, releasePut } from '@Lib/channel';
import { eventLoopQueue } from '@Lib/internal';

describe('Channel', () => {
    describe('makePut', () => {
        it('should put a given value to put queue', () => {
            const ch = channel.makeChannel();
            channel.makePut(ch, 'test1');
            expect(ch.putBuffer.getElementsArray()[0]).toEqual('test1');
        });

        describe("when the channel's buffer size is more than 1", () => {
            describe('when the buffer type is Dropping', () => {
                it('should not put a given value to queue', () => {
                    const ch = channel.makeChannel(BufferType.DROPPING, 2);
                    channel.makePut(ch, 'test1');
                    channel.makePut(ch, 'test2');
                    channel.makePut(ch, 'test3');
                    expect(ch.putBuffer.getElementsArray()).toEqual([
                        'test1',
                        'test2',
                    ]);
                });
            });

            describe('when the buffer type is Sliding', () => {
                it('should remove first item in queue and put the given value', () => {
                    const ch = channel.makeChannel(BufferType.SLIDING, 2);
                    channel.makePut(ch, 'test1');
                    channel.makePut(ch, 'test2');
                    channel.makePut(ch, 'test3');
                    expect(ch.putBuffer.getElementsArray()).toEqual([
                        'test2',
                        'test3',
                    ]);
                });
            });
        });
    });

    describe('makeTake', () => {
        it('should put an item to take queue', () => {
            const ch = channel.makeChannel();
            channel.makeTake(ch);
            expect(ch.takeBuffer.getSize()).toEqual(1);
        });
    });

    describe('releaseTake', () => {
        it('should remove first item from the take queue', () => {
            const ch = channel.makeChannel();
            channel.makeTake(ch);
            channel.releaseTake(ch);
            expect(ch.takeBuffer.getSize()).toEqual(0);
        });
    });

    describe('releasePut', () => {
        it('should remove first item from the put queue and return it', () => {
            const ch = channel.makeChannel();
            channel.makePut(ch, 'test1');
            const result = channel.releasePut(ch);
            expect(result).toEqual('test1');
            expect(ch.putBuffer.getSize()).toEqual(0);
        });
    });

    describe('waitForIncomingTake', () => {
        it('should return promise which resolves only after any item gets to take queue', async () => {
            const spy = jest.fn();
            const ch = channel.makeChannel();
            channel.waitForIncomingTake(ch).then(spy);
            await eventLoopQueue();
            expect(spy).not.toHaveBeenCalled();
            channel.makeTake(ch);
            await eventLoopQueue();
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('waitForIncomingPut', () => {
        it('should return promise which resolves only after any item gets to put queue', async () => {
            const spy = jest.fn();
            const ch = channel.makeChannel();
            channel.waitForIncomingPut(ch).then(spy);
            await eventLoopQueue();
            expect(spy).not.toHaveBeenCalled();
            channel.makePut(ch, 'test');
            await eventLoopQueue();
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('waitForPutQueueToRelease', () => {
        it('should return promise which resolves only after put queue becomes empty', async () => {
            const spy = jest.fn();
            const ch = channel.makeChannel();
            channel.makePut(ch, 'test');
            channel.waitForPutQueueToRelease(ch).then(spy);
            await eventLoopQueue();
            expect(spy).not.toHaveBeenCalled();
            channel.releasePut(ch);
            await eventLoopQueue();
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('waitForTakeQueueToRelease', () => {
        it('should return promise which resolves only after put queue becomes empty', async () => {
            const spy = jest.fn();
            const ch = channel.makeChannel();
            channel.makeTake(ch);
            channel.waitForTakeQueueToRelease(ch).then(spy);
            await eventLoopQueue();
            expect(spy).not.toHaveBeenCalled();
            channel.releaseTake(ch);
            await eventLoopQueue();
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('take', () => {
        it('should take a put value from channel', async () => {
            const ch = makeChannel();
            const spy = jest.fn();
            channel.take(ch).then(spy);
            await eventLoopQueue();
            channel.put(ch, 'test1');
            await eventLoopQueue();
            expect(spy).toHaveBeenCalledWith('test1');
        });

        describe('when channel is closed', () => {
            it('should return channel closed message', async () => {
                const ch = makeChannel();
                channel.close(ch);
                const result = await channel.take(ch);
                expect(result).toEqual(channel.events.CHANNEL_CLOSED);
            });
        });

        describe('when the channel is closed after take was put', () => {
            it('should release take', async () => {
                const ch = makeChannel();
                const spy = jest.fn();
                channel.take(ch).then(spy);
                await eventLoopQueue();
                channel.close(ch);
                await eventLoopQueue();
                expect(spy).toHaveBeenCalledWith(channel.events.CHANNEL_CLOSED);
                expect(ch.takeBuffer.getElementsArray()).toEqual([]);
            });
        });
    });

    describe('put', () => {
        it('should put a value to channel', async () => {
            const ch = makeChannel();
            const spy = jest.fn();
            channel.put(ch, 'test1').then(spy);
            await eventLoopQueue();
            expect(ch.putBuffer.getElementsArray()[0]).toEqual('test1');
            await eventLoopQueue();
            channel.makeTake(ch);
            await eventLoopQueue();
            expect(spy).toHaveBeenCalledTimes(1);
        });

        describe('when the channel is closed', () => {
            it('should not put anytrhing', async () => {
                const ch = makeChannel();
                channel.close(ch);

                await put(ch, 'test1');

                expect(ch.putBuffer.getElementsArray()).toEqual([]);
            });
        });

        describe('when the channel is closed after the item is put', () => {
            it('should release put', async () => {
                const ch = makeChannel();
                const spy = jest.fn();
                put(ch, 'test1').then(spy);
                channel.close(ch);
                await eventLoopQueue();
                expect(ch.putBuffer.getSize()).toEqual(0);
            });
        });

        describe('when the channel buffer size is more than 1', () => {
            describe('when there is no pending take', () => {
                it('should not block put if no take request is there', async () => {
                    const ch = makeChannel(BufferType.DROPPING, 2);
                    const spy = jest.fn();
                    channel.put(ch, 'test1').then(spy);
                    await eventLoopQueue();
                    expect(spy).toHaveBeenCalledTimes(1);
                });

                describe('when the buffer is full', () => {
                    it('should block put request if buffer is full', async () => {
                        const ch = makeChannel(BufferType.DROPPING, 2);
                        const spy = jest.fn();
                        makePut(ch, 'test11');
                        makePut(ch, 'test12');
                        channel.put(ch, 'test1').then(spy);
                        await eventLoopQueue();
                        expect(spy).not.toHaveBeenCalled();
                        releasePut(ch);
                        await eventLoopQueue();
                        expect(spy).toHaveBeenCalledTimes(1);
                    });
                });
            });
        });
    });

    describe('makeChannel', () => {
        it('should create a channel with queues', () => {
            const ch = channel.makeChannel();

            expect(ch.putBuffer.getElementsArray()).toEqual([]);
            expect(ch.takeBuffer.getElementsArray()).toEqual([]);
        });

        it('should close the channel', () => {
            const ch = channel.makeChannel();
            channel.close(ch);
            expect(ch.isClosed).toEqual(true);
        });

        it('should be async iterable', async () => {
            const ch = channel.makeChannel(BufferType.DROPPING, 10);

            await channel.put(ch, 'test1');
            await eventLoopQueue();
            await channel.put(ch, 'test2');
            await eventLoopQueue();
            await channel.put(ch, 'test3');
            await eventLoopQueue();

            const iterator = ch[Symbol.asyncIterator]();

            expect(await iterator.next()).toEqual({
                value: 'test1',
                done: false,
            });
            expect(await iterator.next()).toEqual({
                value: 'test2',
                done: false,
            });
            expect(await iterator.next()).toEqual({
                value: 'test3',
                done: false,
            });
            channel.close(ch);
            expect(await iterator.next()).toEqual({
                value: channel.events.CHANNEL_CLOSED,
                done: true,
            });
        });
    });
});
