import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({sendMail:vi.fn(),fetch:vi.fn()}));
vi.mock('nodemailer',()=>({default:{createTransport:()=>({sendMail:mocks.sendMail})}}));
vi.mock('@/lib/utils/env',()=>({env:{GOOGLE_WORKSPACE_EMAIL:'sender@example.test',GOOGLE_WORKSPACE_APP_PASSWORD:'private-test-password'}}));
import {sendEmail} from '@/lib/email/sendEmail';
const message={to:'recipient@example.test',subject:'Verification',html:'<p>Private link</p>',text:'Private link'};
beforeEach(()=>{vi.resetAllMocks();vi.stubGlobal('fetch',mocks.fetch);});
afterEach(()=>vi.unstubAllGlobals());
it('requires SMTP acceptance of the actual recipient, not merely a fulfilled call',async()=>{
 mocks.sendMail.mockResolvedValue({accepted:[],rejected:[message.to]});expect(await sendEmail(message)).toEqual({delivered:false,provider:'none'});
 mocks.sendMail.mockResolvedValue({accepted:['bcc@example.test'],rejected:[message.to]});expect((await sendEmail(message)).delivered).toBe(false);
 mocks.sendMail.mockResolvedValue({accepted:[message.to],rejected:[]});expect(await sendEmail(message)).toEqual({delivered:true,provider:'google_workspace'});
});
it('does not log recipient, private links or provider error bodies',async()=>{
 const error=vi.spyOn(console,'error').mockImplementation(()=>{});
 mocks.sendMail.mockRejectedValue(Object.assign(new Error('recipient@example.test https://secret.test/?token=private'),{code:'EAUTH'}));
 expect((await sendEmail(message)).delivered).toBe(false);
 expect(error).toHaveBeenCalledWith('Google Workspace email failed',{code:'EAUTH'});error.mockRestore();
});
