'use strict';

function activateLuckyBamboo() {
  let lucky = Math.min(state.bamboo * 0.15, calc.bps * 900) + 13;
  if (state.pu.lucky) lucky *= 2;
  gain(lucky);
  toast('Coup de chance ! +' + fmt(lucky) + ' bambous.');
}
