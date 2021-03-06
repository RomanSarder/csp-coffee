import { Channel } from '../../src/channel';
import { put, take } from '../../src/operators';
import { delay } from '../../src/shared/utils';
import { KitchenRequest } from './entity';

export function randomIntFromInterval(min: number, max: number) {
    // min and max included
    return Math.floor(Math.random() * (max - min) + min);
}

export function* cookerWorker(
    requestsChannel: Channel<any>,
    deliveryChannel: Channel<any>,
) {
    try {
        while (true) {
            let interval;
            const kitcherRequest: KitchenRequest = yield take(requestsChannel);
            console.log(
                `Got ${kitcherRequest.item} to cook for order ${kitcherRequest.orderId}`,
            );
            // eslint-disable-next-line prefer-const
            interval = setInterval(() => {
                console.log('Cooking request', kitcherRequest);
            }, 2000);
            yield delay(randomIntFromInterval(500, 2000));
            clearInterval(interval);
            console.log(
                `Delivering ${kitcherRequest.item} for order ${kitcherRequest.orderId}`,
            );
            yield put(deliveryChannel, kitcherRequest);
            console.log(
                `Delivered ${kitcherRequest.item} for order ${kitcherRequest.orderId}!`,
            );
        }
    } catch (e) {
        console.log(
            'Cooker worker for channel',
            requestsChannel.id,
            'cancelled!',
        );
    }
}
