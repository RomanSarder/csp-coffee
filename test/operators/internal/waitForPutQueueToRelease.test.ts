import { makeChannel } from '@Lib/channel/channel';
import { makePut } from '@Lib/operators/internal/makePut';
import { releasePut } from '@Lib/operators/internal/releasePut';
import { waitForPutQueueToRelease } from '@Lib/operators/internal/waitForPutQueueToRelease';

import { testGeneratorRunner } from '@Lib/testGeneratorRunner';

describe('waitForPutQueueToReleaseAsync', () => {
    describe('when put buffer is blocked', () => {
        it('should complete only after put buffer becomes empty', async () => {
            const ch = makeChannel();
            makePut(ch, 'test');
            const { next } = testGeneratorRunner(waitForPutQueueToRelease(ch));
            expect((await next()).done).toEqual(false);
            releasePut(ch);
            expect((await next()).done).toEqual(true);
        });
    });

    describe('when put buffer is not blocked', () => {
        it('should complete immediately', async () => {
            const ch = makeChannel();
            const { next } = testGeneratorRunner(waitForPutQueueToRelease(ch));
            expect((await next()).done).toEqual(true);
        });
    });
});
