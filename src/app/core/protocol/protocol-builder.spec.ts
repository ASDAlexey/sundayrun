import { buildProtocolRows } from './protocol-builder';
import { EXPECTED_PROTOCOL_ROWS, PROTOCOL_PARTICIPANTS } from './protocol-builder.mock';

describe('buildProtocolRows', () => {
  it('orders 5 km finishers with stable per-gender places, then sorted 2.3 km runners and DNF without places', () => {
    expect(buildProtocolRows(PROTOCOL_PARTICIPANTS)).toEqual(EXPECTED_PROTOCOL_ROWS);
  });
});
