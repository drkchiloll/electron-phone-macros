import firebase from 'firebase/app';
import '@firebase/auth';
import '@firebase/firestore';
import * as Promise from 'bluebird';

export class FireDB {
  public config = {
    apiKey: 'AIzaSyDpd6GPSW5aOFODCg4fl4TCVic8h6ICIrY',
    authDomain: 'entropicos-3bec3.firebaseapp.com',
    databaseURL: 'https://entropicos-3bec3.firebaseio.com',
    projectId: 'entropicos-3bec3',
    storageBucket: 'entropicos-3bec3.appspot.com',
    messagingSenderId: '712380039466'
  };
  public fbEmail = 'sam.womack@entropicos.com';
  public fbPass = '7r4nC3nDenc3!!';
  public db: firebase.firestore.Firestore;
  public fire = firebase;
  public ref: firebase.firestore.CollectionReference;
  public docRef: firebase.firestore.DocumentReference;
  constructor() {
    try {
      this.fire.initializeApp(this.config);
    } catch(e) { }
    this.db = this.fire.firestore();
    this.db.settings({ timestampsInSnapshots: true });
    this.ref = this.db.collection('registrations');
  }
  login() {
    return this.fire.auth()
      .signInWithEmailAndPassword(this.fbEmail, this.fbPass)
      .catch(console.log);
  }
  logout() {
    return this.fire.auth().signOut();
  }
  create(data: any) {
    return this.login().then(() =>
      this.ref.doc(data.id).set(data).then(() =>
        this.get(data.id)
      )
    );
  }
  query(sn) {
    return this.login()
      .then(() => this.ref.limit(1).where('machines', "array-contains", sn).get())
      .then((snapshot) => snapshot.docs)
      .then(([query]) => {
        if(!query) return undefined;
        if(query.exists) {
          return this.ref.doc(query.id).get()
            .then(doc => doc.data());
        }
      })
  }
  get(id: string) {
    return this.login().then(() => this.ref.doc(id).get())
  }
  updateMachine({ id, machine }) {
    const docRef = this.ref.doc(id);
    return new Promise((resolve, reject) =>
      this.db.runTransaction((trans) =>
        trans.get(docRef).then(doc => {
          const machines = doc.data().machines;
          machines.push(machine);
          trans.update(docRef, { machines });
          return resolve(doc.data());
        }))
    )
  }
  updateApps(id) {
    const docRef = this.ref.doc(id);
    return new Promise((resolve, reject) =>
      this.db.runTransaction((trans) =>
        trans.get(docRef).then(doc => {
          const apps = doc.data().apps;
          apps.push('platform-automation');
          trans.update(docRef, { apps })
          return resolve(doc.data());
        })
      )
    )
  }
}