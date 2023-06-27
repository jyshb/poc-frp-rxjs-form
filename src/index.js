import { BehaviorSubject, filter, fromEvent, map, merge, of } from "rxjs";

/*
Ignore everything below the dashed line, for this code at least.

For a small, simple form like this, cells add an extra overhead.
So now the form DOM elements hold the current state, while streams propagate the changes.
No cells for now.
---------

Cells hold the state. A cell variable is prefixed with `c`.
Streams propagate changes in the state. A stream variable is prefixed with `s`.

As an example, cLongClickToggle holds the last value coming from a merged stream of sLongClickToggleInit (that propagates one-off initial local storage value) and sLongClickToggleInput (that propagates changes made to the checkbox by the user). Thus, cLongClickToggle can justly act as the source of truth within the FRP system for longClickToggle value.

Form elements pose a problem in that they have their own state.

Treating the DOM element state as the source of truth (and not maintaining our own Cell at all) brings in complexity for a large form with interrelated form elements.

What seems better currently is to treat the state held by DOM form elements as external to the FRP system. As such, due to the stream that sends user inputs/changes of an input box to the corresponding Cell, the DOM input state and the Cell state should automatically stay in sync with each other.

In this cell-as-the-source-of-truth approach, it also becomes the cell's responsibility to propagate the initial-value to the corresponding input element, by updating the input.value or input.checked programmatically in cell.subscribe(). This works really well.

However, due to the merged stream of initial-value and user-changes, the above subscribe() would trigger even for the state changes made by the user on the input element. So, after the initial value from localStorage, the input element is effectively being fed its own state changes. This introduces a pseudo-loop. pseudo because when the input element is fed its own state chagne, because the 'feeding' is done programmatically by setting input.value, it does not trigger a 'change' or 'input' or whatever event.

So, while its likely not going to induce a recursive loop, this is a point of a discomfort. Let's wait and watch.
 */

function hold(stream, defaultValue) {
  const cell = new BehaviorSubject(defaultValue);
  stream.subscribe(cell);
  return cell;
}

function isHoldTimeInputValid(v) {
  return v.length > 0 && !Number.isNaN(parseInt(v)) && parseInt(v) >= 1000;
}

const sLongClickToggleInit = of(
    window.localStorage.getItem("longClickToggle") || JSON.stringify(true)
).pipe(map((v) => JSON.parse(v)));

sLongClickToggleInit.subscribe((v) => {
  const e = document.querySelector("#longClickToggle");
  e.checked = v;
});

const sLongClickToggleInput = fromEvent(
    document.querySelector("#longClickToggle"),
    "change"
).pipe(map((ev) => ev.target.checked));

const sLongClickToggleChange = merge(
    sLongClickToggleInit,
    sLongClickToggleInput
);

sLongClickToggleChange.subscribe(function (v) {
  const e = document.querySelector("#holdTime");
  e.disabled = !v;
});

sLongClickToggleChange.subscribe(function (v) {
  window.localStorage.setItem("longClickToggle", JSON.stringify(v));
});

const sHoldTimeInit = of(
    window.localStorage.getItem("holdTime") || JSON.stringify("1000")
).pipe(map((v) => JSON.parse(v)));

sHoldTimeInit.subscribe(function (v) {
  const e = document.querySelector("#holdTime");
  e.value = v;
});

const sHoldTimeInput = fromEvent(
    document.querySelector("#holdTime"),
    "input"
).pipe(map((ev) => ev.target.value));

const sHoldTimeChange = merge(sHoldTimeInit, sHoldTimeInput);

const sHoldTimeParsed = sHoldTimeChange.pipe(
    filter((v) => isHoldTimeInputValid(v))
);

sHoldTimeParsed.subscribe(function (v) {
  window.localStorage.setItem("holdTime", JSON.stringify(v));
});

const sIsHoldTimeValid = sHoldTimeChange.pipe(
    map((v) => isHoldTimeInputValid(v))
);

sIsHoldTimeValid.subscribe(function (v) {
  const e = document.querySelector("#holdTime");
  e.setAttribute("aria-invalid", v ? "false" : "true");
});
