import { makeChannel } from '@Lib/channel';
import { makePut, releasePut } from '@Lib/operators';

describe('releasePut', () => {
    it('should remove first item from the put buffer and return it', () => {
        const ch = makeChannel();
        makePut(ch, 'test1');
        const result = releasePut(ch);
        expect(result).toEqual('test1');
        expect(ch.putBuffer.getSize()).toEqual(0);
    });
});
