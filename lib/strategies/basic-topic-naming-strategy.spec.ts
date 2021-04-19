import * as fc from 'fast-check';
import { BasicTopicNamingStrategy } from './basic-topic-naming-strategy';

describe(BasicTopicNamingStrategy.name, () => {
    it('returns its argument unmodified', () => {
        const strat = new BasicTopicNamingStrategy();

        // prettier-ignore
        fc.assert(fc.property(
            fc.fullUnicodeString(),
            s => {
                expect(strat.generateTopicName(s)).toBe(s)
            }
        ))
    });
});
