import Vue from "vue";
import firebase from "firebase/app";
import "firebase/firestore";
import pluralize from "pluralize";

if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyDXEdgDM7sxK1MSp0gyzuoyo08PMyDyr88",
    authDomain: "moneta-e4f2a.firebaseapp.com",
    databaseURL: "https://moneta-e4f2a.firebaseio.com",
    projectId: "moneta-e4f2a",
    storageBucket: "",
    messagingSenderId: "251368168453",
    appId: "1:251368168453:web:52eab046e781596aa4d06c",
  });
}

export const db = firebase.firestore();

export class Firestore {
  constructor(name) {
    this.name = name;
    this.collectionName = this.name;
    this.memberName = pluralize.singular(this.name);
  }
  get state() {
    return () => ({
      values: [],
      unsubscribe: null,
    });
  }
  get getters() {
    return {
      collection: state => state.values,
      [this.collectionName]: state => state.values,
      member: state => id => state.values.find(value => value.id === id),
      [this.memberName]: state => id =>
        state.values.find(value => value.id === id),
    };
  }
  get mutations() {
    return {
      add(state, { id, data }) {
        state.values.push({ id, ...data });
      },
      modify(state, { id, data }) {
        const index = state.values.findIndex(value => value.id === id);
        Vue.set(state.values, index, { id, ...data });
      },
      remove(state, { id }) {
        const index = state.values.findIndex(value => value.id === id);
        state.values.splice(index, 1);
      },
      setUnsubscribe(state, unsubscribe) {
        state.unsubscribe = unsubscribe;
      },
    };
  }
  get actions() {
    return {
      add: (_, data) =>
        db.collection(this.name).add({
          ...data,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        }),
      modify: (_, { id, data }) => {
        db.collection(this.name)
          .doc(id)
          .update({ ...data });
      },
      remove: (_, id) => {
        if (confirm("本当に削除してよろしいですか")) {
          db.collection(this.name)
            .doc(id)
            .delete();
        }
      },
      listen: ({ state, commit }) => {
        if (state.unsubscribe !== null) {
          return;
        }
        const unsubscribe = db.collection(this.name).onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            const id = change.doc.id;
            const data = change.doc.data();
            if (change.type === "added") {
              commit("add", { id, data });
            } else if (change.type === "modified") {
              commit("modify", { id, data });
            } else if (change.type === "removed") {
              commit("remove", { id });
            }
          });
        });
        commit("setUnsubscribe", unsubscribe);
      },
    };
  }
}
