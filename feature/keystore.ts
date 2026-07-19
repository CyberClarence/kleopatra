"use client";
import { randomUUID } from "crypto";
import * as openpgp from "openpgp";
import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type ArmoredRSAPrivateKey = string;
type ArmoredPublicKey = string;

type SerialisablePrivateKey = {
  id: string;
  keyname?: string
  key: ArmoredRSAPrivateKey;
};

type SerialisablePublicKey = {
  id: string;
  keyname?: string;
  key: ArmoredPublicKey;
};

type KeyStoreData = {
  myPrivateKeys: Array<SerialisablePrivateKey>;
  myPublicKeys: Array<SerialisablePublicKey>;
};

type KeyStoreActions = {
  importPublicKey: (keyname: string, armoredKeyString: string) => Promise<SerialisablePublicKey>;
  importPrivateKey: (keyname: string, armoredKeyString: string) => Promise<SerialisablePrivateKey>;
  getPrivateKeyFromMyPrivateKeys: (name: string) => Promise<SerialisablePrivateKey>;
  getPublicKeyFromMyPrivateKeys: (name: string) => Promise<SerialisablePublicKey>;
  getPublicKeyFromMyPublicKeys: (name: string) => Promise<SerialisablePublicKey>;
  deletePrivateKey: (keyname: string) => void;
  deletePublicKey: (keyname: string) => void;
  renamePrivateKey: (keyid: string, keyname: string) => void;
  renamePublicKey: (keyid: string, keyname: string) => void;
};

type KeyStoreInterface = KeyStoreData & KeyStoreActions;

export const keyStore: StateCreator<KeyStoreInterface> = (set, get) => ({
  createNewKey: async (name) => {
    const { privateKey, publicKey, revocationCertificate } =
      await openpgp.generateKey({
        type: "rsa",
        rsaBits: 4096,
        userIDs: [],
        format: "armored",
      });

    const myNewPrivateKey: SerialisablePrivateKey = {
      id: crypto.randomUUID(),
      keyname: name || "unamed",
      key: privateKey,
    };
    set({
      myPrivateKeys: [...get().myPrivateKeys, myNewPrivateKey],
    });
  },
  importPublicKey: async (keyname, amoredPublicKeyString) => {
    const key = await openpgp.readKey({ armoredKey: amoredPublicKeyString });
    const { myPublicKeys } = get();

    const alreadyExist = myPublicKeys.find((key) => key.id == keyname);

    if (alreadyExist) throw new Error("this key id is already used");

    const newKey: SerialisablePublicKey = {
      id: crypto.randomUUID(),
      keyname: keyname || "unamed",
      key: amoredPublicKeyString,
    };

    set({ myPublicKeys: [...myPublicKeys, newKey] });
    return newKey;
  },
  importPrivateKey: async (keyname, amoredPublicKeyString) => {
    const key = await openpgp.readKey({ armoredKey: amoredPublicKeyString });
    const { myPrivateKeys } = get();

    const alreadyExist = myPrivateKeys.find((key) => key.id == keyname);

    if (alreadyExist) throw new Error("this key id is already used");

    const newKey: SerialisablePrivateKey = {
      id: crypto.randomUUID(),
      keyname: keyname || "unamed",
      key: amoredPublicKeyString,
    };

    set({ myPrivateKeys: [...myPrivateKeys, newKey] });
    return newKey;
  },
  getPrivateKeyFromMyPrivateKeys: async (keyid) => {
    const { myPrivateKeys } = get();
    const key = myPrivateKeys.find((key) => key.id == keyid);
    if (!key) throw new Error("no key found with that id (" + keyid + ")");
    return key;
  },
  getPublicKeyFromMyPrivateKeys: async (keyid) => {
    const { myPrivateKeys } = get();
    const key = myPrivateKeys.find((key) => key.id == keyid);
    if (!key) throw new Error("no key found with that id(" + keyid+ ")");
    const privateKey = await openpgp.readPrivateKey({
      armoredKey: key.key,
    });
    const publicKey = privateKey.toPublic();
    const publicKeyArmorStringFormat = publicKey.armor();
    
    return {
      id: key.id,
      keyname: key.keyname,
      key: publicKeyArmorStringFormat
    };
  },
  getPublicKeyFromMyPublicKeys: async (keyid) => {
    const { myPublicKeys } = get();
    const foundKey = myPublicKeys.find((key) => key.id == keyid);
    if (!foundKey) throw new Error("no key found with that id");
    return foundKey;
  },
  deletePrivateKey: (keyid: string) => {
    const { myPrivateKeys } = get();
    const filteredKeys = myPrivateKeys.filter(key => key.id !== keyid);
    set({ myPrivateKeys: filteredKeys });
  },
  deletePublicKey: (keyid: string) => {
    const { myPublicKeys } = get();
    const filteredKeys = myPublicKeys.filter(key => key.id !== keyid);
    set({ myPublicKeys: filteredKeys });
  },
  renamePrivateKey: (keyid: string, keyname: string) => {
    // Only the display label changes; the stored armored key is untouched.
    set({
      myPrivateKeys: get().myPrivateKeys.map((key) =>
        key.id === keyid ? { ...key, keyname } : key
      ),
    });
  },
  renamePublicKey: (keyid: string, keyname: string) => {
    set({
      myPublicKeys: get().myPublicKeys.map((key) =>
        key.id === keyid ? { ...key, keyname } : key
      ),
    });
  },
  myPrivateKeys: [],
  myPublicKeys: [],
});

export const useKeyStore = create<KeyStoreInterface>()(
  persist(keyStore, {
    name: "keystore",
  })
);
