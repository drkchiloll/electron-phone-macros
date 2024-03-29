import { TeamsGuestIssuer } from 'webexteams-guestissuer';
import { FireDB } from './firebase-db';
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
  apps: string[];
  killSwitch: boolean;
  update: boolean;
};

export const REGISTRATION: any = {
  fire: new FireDB(),
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
      .then(output => output.match(/SerialNumber\s+\n(.*)/)[1].trim())
  },
  verify() {
    try {
      if(!JSON.parse(localStorage.getItem('registration'))) {}
      else this.registration = JSON.parse(localStorage.getItem('registration'));
      return true;
    } catch(e) {
      return false;
    }
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
    return this.generateMachineId().then((machine: any) => {
      return this.fire.get(id).then(d => {
        if(d.exists) return d.data();
        else return undefined;
      }).then(doc => {
        if(doc) {
          const { machines } = doc;
          if(!machines.find((m => m.sn === machine.sn))) {
            return this.fire.updateMachine({ id, machine })
              .then(doc => {
                localStorage.setItem('registration', JSON.stringify(doc));
                return doc;
              })
          } else {
            return doc;
          }
        } else {
          return undefined;
        }
      })
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
            membershipId: null,
            apps: ['phone-macros'],
            killSwitch: false,
            update: false
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
            return this.fire.create(reg);
          }).then(record => {
            return record.data();
          });
        })
      })
  },
  init({ id, user, email, company }) {
    if(id) return this.getRecord(id).then((doc) => {
      localStorage.setItem('registration', JSON.stringify(doc));
      return doc;
    });
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
      return this.fire.createRecord(reg)
    }).then((doc: any) => {
      console.log(doc.data());
      if(doc.exists) return doc.data();
    });
  }
};