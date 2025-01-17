import { getFirestore } from "firebase-admin/firestore";
import * as Diff from "diff";
import admin from "firebase-admin";
import settings from "../../settings.js";
import serviceAccountKey from "../../serviceAccountKey.json" assert { type: "json" };
//const serviceAccountKey = await import(settings.firebaseServiceAccountKeyPath);
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
  });
} catch (e) {
  console.log(e);
}
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

export const saveBook = async (book) => {
  console.log("saving book");
  console.log({ book });
  if (!book) {
    console.log("no book to save");
    return;
  }
  book.created_at = Date.now();
  const docRef = db.collection("books").doc(book.bookid);
  try {
    await docRef.set(book);
    console.log("Successfully synced book to Firestore");
  } catch (error) {
    console.error("Error syncing book to Firestore:", error);
  }
};

export const getBook = async (bookid) => {
  console.log("getting book");
  console.log({ bookid });
  const docRef = db.collection("books").doc(bookid);
  const bookObj = await docRef.get();
  if (!bookObj.exists) {
    return null;
  }
  const book = bookObj.data();
  console.log("1chapters", book.chapters);
  const chapters = await db
    .collection("chapters")
    .where("bookid", "==", bookid)
    .get();

  if (chapters.empty) {
    console.log("No chapters found.");
  } else {
    chapters.forEach((chapter) => {
      const data = chapter.data();
      console.log("data", data);
      book.chapters.push(data);
    });
  }
  console.log("chapters", book.chapters);
  return book;
};

export const deleteBook = async (bookid) => {
  console.log("deleting book");
  console.log({ bookid });

  const chapters = await db
    .collection("chapters")
    .where("bookid", "==", bookid)
    .get();

  if (chapters.empty) {
    console.log("No chapters found.");
  } else {
    const batch = db.batch();
    chapters.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  const docRef = db.collection("books").doc(bookid);
  await docRef.delete();
};

export const getBooks = async (userid) => {
  console.log("getting books");
  console.log({ userid });
  const books = await db
    .collection("books")
    .where("userid", "==", userid)
    .get();
  console.log(books);
  if (books.empty) {
    console.log("No books found.");
    return [];
  } else {
    const allBooks = [];
    books.forEach((book) => {
      allBooks.push(book.data());
    });
    return allBooks;
  }
};

export const saveChapter = async (chapter) => {
  console.log("saving chapter");
  console.log({ chapter });
  if (!chapter) {
    console.log("no chapter to save");
    return;
  }
  chapter.created_at = Date.now();
  const docRef = db.collection("chapters").doc(chapter.chapterid);
  try {
    await docRef.set(chapter);
    console.log("Successfully synced chapter to Firestore");
  } catch (error) {
    console.error("Error syncing chapter to Firestore:", error);
  }
};

export const getChapter = async (chapterid) => {
  console.log("getting chapter");
  console.log({ chapterid });
  const docRef = db.collection("chapters").doc(chapterid);
  const chapter = await docRef.get();
  if (!chapter.exists) {
    return null;
  }
  return chapter.data();
};

export const deleteChapter = async (chapterid) => {
  console.log("getting chapter");
  console.log({ chapterid });
  await db.collection("chapters").doc(chapterid).delete();
};

export const getHistory = async (chapterid) => {
  const docRef = db.collection("history").doc(chapterid);
  const bookObj = await docRef.get();
  if (!bookObj.exists) {
    return [];
  }
  return bookObj.data().history;
};

export const saveToHistory = async (chapterid, text) => {
  let docRef = db.collection("history").doc(chapterid);
  const bookObj = await docRef.get();

  if (!bookObj.exists) {
    const history = [text];
    const docRef = db.collection("history").doc(chapterid);
    await docRef.set({ history });
    return;
  }
  const history = bookObj.data().history;

  let old = history[0];
  history.slice(1).forEach((patch) => {
    old = Diff.applyPatch(old, patch);
  });

  // const old = history[history.length - 1];
  console.log("old", old);
  const patch = Diff.createPatch(chapterid, old, text, "-", "-");
  console.log("patch", patch);
  history.push(patch);
  docRef = db.collection("history").doc(chapterid);
  await docRef.set({ history });

  /*
  patch Index: n2rViOebV8aCrxEeIR4e7
===================================================================
--- n2rViOebV8aCrxEeIR4e7	-
+++ n2rViOebV8aCrxEeIR4e7	-
@@ -1,1 +1,1 @@
-Once upon a time...
\ No newline at end of file
+Once  a time... there was
*/
  /* diff [
    { count: 2, value: 'Once  ' },
    { count: 2, added: undefined, removed: true, value: 'upon ' },
    { count: 4, value: 'a time...' },
    { count: 5, added: true, removed: undefined, value: ' there was\n' }
  ] */
  /* const theDiff = Diff.diffWords(old, text);
  console.log("diff", theDiff);
  history.push(theDiff);
  docRef = db.collection("history").doc(chapterid);
  await docRef.set({ history }); */
};
