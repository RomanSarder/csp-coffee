import { InstructionType } from '@Lib/instruction';
import type { CancellablePromise } from '@Lib/cancellablePromise';
import type { StepResult } from '../entity/stepResult';
import type { ChildrenIteratorsRunner } from '../entity/childrenIteratorsRunner';
import { handleCancellablePromise } from './handleCancellablePromise';

export async function handleGenerator({
    runIteratorPromise,
    childrenIteratorsRunner,
    done,
    type,
}: {
    runIteratorPromise: CancellablePromise<any>;
    done: boolean;
    type?: InstructionType.FORK | InstructionType.SPAWN;
    childrenIteratorsRunner: ChildrenIteratorsRunner;
}): Promise<StepResult> {
    if (type === InstructionType.FORK) {
        return {
            value: childrenIteratorsRunner.fork(runIteratorPromise),
            done,
        };
    }

    if (type === InstructionType.SPAWN) {
        return {
            value: childrenIteratorsRunner.spawn(runIteratorPromise),
            done,
        };
    }

    return handleCancellablePromise({
        childrenIteratorsRunner,
        promise: runIteratorPromise,
        done,
    });
}
