# Side effects and Sagas

A side effect is any observable effect outside of the state. Often, a
side effect is the result of, or is accompanied by, non-deterministic
processing.

A common example of a side effect is when a [covenant](covenant.md) must
make an asynchronous call to a an external service to collect data that
should be stored in the state. When handling such calls, the strategy to
use is called a saga. A saga is a generator function that performs one
or more steps to collect information destined for the state.

Consider the situation when you want to book a trip. Your trip might
involve reserving a flight, hotel, and rental vehicle. Making the
reservations requires communicating with each provider, can take a
notable amount of time, and could fail for any number of reasons. If any
of the reservations fails, the trip has to be considered "not booked";
it is not useful to reserve a hotel and rental vehicle if you cannot
reserve a flight.

A saga could process each of the reservation requests, retrying if any
of the service providers is temporarily unavailable, and -- once all of
the requests are complete -- dispatch the booked trip to the state. If
the saga was interrupted during processing, the trip also would not be
booked.

The repo contains a contrived saga that asynchronously adds values to
the state, provided they match the definition of a limited alphabet:

```js
let instance
const createContext = () => {
  if (instance) {
    return instance
  }
  const contents = fs.readFileSync(
    path.join(__dirname, 'alphabet.json'),
    'utf8'
  )
  const alphabet = JSON.parse(contents)
  const getAlphabet = () => alphabet
  instance = {
    getAlphabet
  }
  return instance
}

const worker = {
  checkInAlphabet: async (value, context) => {
    const alphabet = context.getAlphabet()
    return alphabet.includes(value)
  }
}
const sagaDefault = {
  createContext,
  worker
}

function* rootSaga({ createContext, worker } = sagaDefault) {
  const context = createContext()
  yield all([
    takeEvery(types.CHECK_IN_ALPHABET_SAGA, function*(action) {
      const { value } = action.payload
      const isInAlphabet = yield worker.checkInAlphabet(value, context)
      yield put(actions.checkInAlphabetSagaResponse(isInAlphabet))
    })
  ])
}
```
