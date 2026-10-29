import {it,expect} from 'vitest';
import {isDollVueUnlimitedTestEmail} from '@/lib/dollvue/testEntitlement';
import {accessFailureMessage} from '@/components/dollvue/DollVueAccessGate';
it('grants only the exact approved test identities, never a domain or wildcard',()=>{
 expect(isDollVueUnlimitedTestEmail(' HELLO@DOLLWOW.COM ')).toBe(true);
 for(const email of ['sales@dollwow.com','hello@dollwow.com.evil.test','customer@example.test','amitvsonawane@gmail.com'])expect(isDollVueUnlimitedTestEmail(email)).toBe(false);
 expect(isDollVueUnlimitedTestEmail('partner@example.test','partner@example.test')).toBe(true);
 expect(isDollVueUnlimitedTestEmail('customer@example.test','*@example.test')).toBe(false);
});
it('shows fixed actionable errors without reflecting private provider text',()=>{
 expect(accessFailureMessage({code:'rate_limited'})).toContain('wait');
 expect(accessFailureMessage({code:'send_failed'})).toContain('could not send');
 expect(accessFailureMessage({code:'eligibility_unavailable'})).toContain('check this doll');
 expect(accessFailureMessage(null)).toContain('try again');
});
