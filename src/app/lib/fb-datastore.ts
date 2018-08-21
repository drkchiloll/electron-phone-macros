import firebase from 'firebase/app';
import '@firebase/auth';
import '@firebase/firestore';
import { Promise } from 'bluebird';

const fbemail = 'sam.womack@entropicos.com';
const fbcred = '7r4nC3nDenc3!!';

const config = {
  apiKey: 'AIzaSyDpd6GPSW5aOFODCg4fl4TCVic8h6ICIrY',
  authDomain: 'entropicos-3bec3.firebaseapp.com',
  databaseURL: 'https://entropicos-3bec3.firebaseio.com',
  projectId: 'entropicos-3bec3',
  storageBucket: 'entropicos-3bec3.appspot.com',
  messagingSenderId: '712380039466'
};
firebase.initializeApp(config);

export const fb = {
  db: null,
  signIn() {
    return firebase
      .auth()
      .signInWithEmailAndPassword(fbemail, fbcred)
      .catch(console.log)
  },
  signOut() {
    return firebase
      .auth()
      .signOut();
  },
  genDb() {
    this.db = firebase.firestore();
    this.db.settings({
      timestampsInSnapshots: true
    });
    return Promise.resolve();
  },
  initialize(registrationId?: string) {
    return this.signIn()
      .then(() => this.genDb())
      .then(() => {
        if(registrationId) {
          const ref = this.db.doc(registrationId);
          return ref.get().then((doc: any) => doc.data);
        } else {
          return this.db;
        }
      })
  },
  createRecord(data: any) {
    return this.signIn()
      .then(() => this.genDb().then(() => this.db.collection('registrations')))
      .then((ref) => ref.doc(data.id).set(data)
      .then(() => ref.doc(data.id).get()))
  },
  getRecord(id: string) {
    return this.signIn()
      .then(() => this.genDb().then(() => this.db.collection('registrations')))
      .then(ref => ref.doc(id).get())
  },
  updateMachine({id, machine}) {
    const docRef = this.db.collection('registrations').doc(id);
    return new Promise(resolve => this.db.runTransaction((transaction) =>
      transaction.get(docRef).then(doc => {
        const machines = doc.data().machines;
        machines.push(machine);
        transaction.update(docRef, { machines });
        return resolve(doc.data())
      }))
    )
  }
}