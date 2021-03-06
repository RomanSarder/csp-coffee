import {
    FlattenChannels,
    Channel,
    ChannelConfiguration,
    makeChannel,
    waitUntilBufferIsEmptyAsync,
    close,
} from '@Lib/channel';
import { createAsyncWrapper } from '@Lib/runner';
import { put } from '../core/put';
import { DefaultResultChannelConfig } from '../config';
import { iterate } from './iterate';
import type { ChannelTransformationResponse } from './entity/channelTransformationResponse';

export function map<
    Channels extends Channel<any>[],
    M extends NonNullable<any> = any,
>(
    mapFn: (data: FlattenChannels<Channels>) => M,
    channels: Channels,
    { bufferType, capacity }: ChannelConfiguration = DefaultResultChannelConfig,
): ChannelTransformationResponse<M> {
    const mappedCh = makeChannel<M>(bufferType, capacity);

    const promise = (async () => {
        try {
            await createAsyncWrapper(iterate)(function* mapValues(data) {
                yield put(mappedCh, mapFn(data as FlattenChannels<Channels>));
            }, ...channels);

            await waitUntilBufferIsEmptyAsync(mappedCh);
            close(mappedCh);
        } catch (e) {
            close(mappedCh);
        }
    })();

    return { ch: mappedCh, promise };
}
