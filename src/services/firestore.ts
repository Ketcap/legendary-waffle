import { admin } from '../config';

type Collection = {
  id: string;
};

export interface Channel extends Collection {
  // Used as channelId for telegram
  id: string;
  name: string;
  registered: boolean;
}

interface Item extends Collection {
  name?: string;
  url: string;
  updatedAt?: Date;
  price: number;
  [key: string]: any;
}

interface History extends Collection {
  field: string;
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
}

export enum Tables {
  channels = 'channels',
  items = 'items',
  history = 'history',
}

type TableReturns = {
  [Tables.channels]: Channel;
  [Tables.history]: History;
  [Tables.items]: Item;
};

const db = admin.firestore();

/**
 * Get document from table with the id
 * @param collection Table name
 * @param id Id of the document
 * @returns DocumentData | Undefined
 */
export async function getDocWithId<T extends Tables>(
  collection: T,
  id: string
): Promise<TableReturns[T] | undefined> {
  const table = db.collection(collection);
  const docRef = table.doc(id);
  const document = await docRef.get();
  return document.exists ? (document.data() as any) : undefined;
}

/**
 * Get all documents from table
 * @param collection Table name
 * @returns DocumentData[]
 */
export async function getListFromTable<T extends Tables>(
  collection: T
): Promise<TableReturns[T][]> {
  const table = db.collection(collection);
  const tableSnapshot = await table.get();
  return tableSnapshot.docs.map((item) => {
    return item.data();
  }) as any;
}

/**
 * Insert document to selected table
 * @param collection Table name
 * @param data DocumentData
 * @returns DocumentData
 */
export enum CreateError {
  Exists = 'exists',
}
export async function createDocument<T extends Tables>(
  collection: T,
  data: TableReturns[T]
): Promise<TableReturns[T] | CreateError> {
  const table = db.collection(collection);
  const docRef = table.doc(data.id);
  const doc = await docRef.get();
  if (doc.exists) {
    return CreateError.Exists;
  }
  return docRef.set(data) as any;
}

/**
 * Update document from given document (updated fields) with matching id
 * @param collection Table name
 * @param data DocumentData
 * @returns DocumentData
 */
export enum UpdateError {
  NotExists = 'notexists',
}
export async function updateDocument<T extends Tables>(
  collection: T,
  id: string,
  data: Partial<TableReturns[T]>
): Promise<TableReturns[T] | UpdateError> {
  const table = db.collection(collection);
  const docRef = table.doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return UpdateError.NotExists;
  }
  return docRef.update(data) as any;
}
