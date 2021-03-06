import type { Flatten } from '@Lib/shared/entity';
import type { Channel } from './channel';

export type FlattenChannel<Type> = Type extends Channel<infer Item>
    ? Item
    : unknown;
export type FlattenChannels<Type> = FlattenChannel<Flatten<Type>>;
