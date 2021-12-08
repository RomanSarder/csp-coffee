import { ChannelConfiguration } from '@Lib/channel/entity/channelConfiguration';
import { Channel } from '@Lib/channel/entity/channel';
import { FlattenChannels } from '@Lib/channel/entity/flatten';
import { makeChannel } from '@Lib/channel/channel';
import { createAsyncWrapper } from '@Lib/shared/utils/createAsyncWrapper';
import { close } from '../core/close';
import { put } from '../core/put';
import { iterate } from '../collection/iterate';
import { DefaultResultChannelConfig } from '../config';
import { constant } from '@Lib/shared/utils';

export function merge<
    Channels extends Channel<any>[],
    AggregatedType = FlattenChannels<Channels>,
>(
    channels: Channels,
    { bufferType, capacity }: ChannelConfiguration = DefaultResultChannelConfig,
): { ch: Channel<AggregatedType>; promise: Promise<void> } {
    const mergedChannel = makeChannel<AggregatedType>(bufferType, capacity);
    const promise = (async () => {
        try {
            await createAsyncWrapper(iterate)(
                function* mapValues(data) {
                    yield put(mergedChannel, data);
                },
                constant(true),
                ...channels,
            );
        } finally {
            close(mergedChannel);
        }
    })();

    return { ch: mergedChannel, promise };
}
