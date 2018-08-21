import { TeamsGuestIssuer } from 'webexteams-guestissuer';
import { fb } from './fb-datastore';
import { exec } from 'child_process';

const appId = `Y2lzY29zcGFyazovL3VzL09SR0FOSVpBVElPTi82NTRhZDhk` +
  `ZC02ZjY3LTQwNGYtYThmYi0xM2Y1MDQwYmVmMGE`;
const appSecret = 'JnV++4QsGVLr0q9s3cxzZWXMXDhJuujEaEkFnT5AjEc=';
const teamId = 'Y2lzY29zcGFyazovL3VzL1RFQU0vNWZkZjNmNjAtOWIyZC0x' +
  'MWU4LWJmMzMtOTcwNTMzOWZjY2Y4';
const botToken = 'NWVjY2FjYzEtYWYxNC00ZTk3LTkxOTYtMDhiMmI3Nzg2ZjhkZjgzY2ZkMTctZWYz';

export type registration = {
  id: string;
  machines: [{ sn: string, platform: string }],
  emails: string[],
  displayName: string;
  userid: string;
  companyName: string;
  personId: string;
  created: string;
  membershipId: string;
};

export const REGISTRATION: any = {
  guest: TeamsGuestIssuer(appId, appSecret),
  registration: null,
  macSn: 'ioreg -l | grep IOPlatformSerialNumber',
  winSn: 'wmic bios get serialnumber',
  runCommand(cmd) {
    return new Promise(resolve =>
      exec(cmd, (e, stdout, stderr) => resolve(stdout)))
  },
  getMacSn() {
    return this.runCommand(this.macSn)
      .then(output => output.match(/\=\s\"(\S+)\"/)[1]);
  },
  getWinSn() {
    return this.runCommand(this.winSn)
      .then(output => {
        return output;
      })
  },
  verify() {
    if(!JSON.parse(localStorage.getItem('registration'))) return false;
    else this.registration = JSON.parse(localStorage.getItem('registration'));
    return true;
  },
  generateMachineId() {
    if(process.platform === 'darwin') {
      return this.getMacSn().then(sn => ({
        sn, platform: 'macOS'
      }));
    } else {
      return this.getWinSn().then(sn => ({
        sn, platform: 'win32'
      }));
    }
  },
  getRecord(id) {
    let registration;
    return this.generateMachineId().then((machine: any) => {
      return fb.getRecord(id.toLowerCase())
        .then(doc => {
          if(doc.exists) {
            registration = doc.data();
            const { machines } = registration;
            if(!machines.find((m: any) => m.sn === machine.sn)) {
              registration.machines.push(machine);
              return fb.updateMachine({ id: id.toLowerCase(), machine });
            }
          }
        }).then((reg) => {
          localStorage.setItem('registration', JSON.stringify(reg || registration));
          return reg ? reg : registration;
        });
    })
  },
  createRegistration({ user, email, company }) {
    const userid = this.guest.generateId();
    let authData: any;
    return this.guest.generateJwt({ userid, user })
      .then(({ token }) => this.guest.retrieveAuthToken(token))
      .then((auth: any) => {
        authData = auth;
        return this.guest.teamsGetUser(auth.token)
      })
      .then((guestUser: any) => {
        const emails = guestUser.emails;
        emails.push(email);
        return this.generateMachineId().then(machine => {
          let reg: registration = {
            id: guestUser.emails[0].split('@')[0],
            machines: [machine],
            userid,
            displayName: user,
            created: guestUser.created,
            emails,
            companyName: company,
            personId: guestUser.id,
            membershipId: null
          };
          return this.guest.genericRequest({
            url: '/team/memberships',
            method: 'post',
            data: {
              teamId,
              personId: guestUser.id
            },
            token: botToken
          }).then(({ id }) => {
            reg.membershipId = id;
            localStorage.setItem('registration', JSON.stringify(reg));
            return fb.createRecord(reg);
          }).then(record => {
            return record.data();
          });
        })
      })
  },
  init({ id, user, email, company }) {
    if(id) return this.getRecord(id);
    else return this.createRegistration({ user, email, company });
  },
  test(register) {
    return this.generateMachineId().then(machine => {
      let reg = {
        id: '1111-11111111-1111-11111',
        machines: [machine],
        userid: this.guest.generateId(),
        displayName: 'Admin Entropicos',
        created: '2018-08-19',
        email: ['admin@entropicos.com'],
        companyName: 'Entropicos',
        personId: 'Y2KM',
        membershipId: 'Y2KN'
      };
      return fb.createRecord(reg)
    }).then((doc: any) => {
      console.log(doc.data());
      if(doc.exists) return doc.data();
    });
  }
};