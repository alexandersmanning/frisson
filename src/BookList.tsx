import * as t from "./Types";
import React from "react";
import List from "./components/List";
import { Link } from "react-router-dom";
import Button from "./components/Button";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import ListMenu from "./ListMenu";
import { ListItem } from "./ListItem";

export default function BookList({
  books,
  selectedBookId,
  onChange,
  closeSidebar,
  canCloseSidebar = true,
}: {
  books: t.Book[];
  selectedBookId: string;
  onChange: () => void;
  closeSidebar: () => void;
  canCloseSidebar?: boolean;
}) {
  async function deleteBook(bookid: string) {
    const res = await fetch(`/api/deleteBook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookid }),
    });
    if (!res.ok) {
      console.log(res.statusText);
      return;
    }
    await onChange();
  }
  async function favoriteBook(bookid: string) {
    const res = await fetch(`/api/favoriteBook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookid }),
    });
    if (!res.ok) {
      console.log(res.statusText);
      return;
    }
    await onChange();
  }

  const newBook = async () => {
    const res = await fetch("/api/newBook", {
      method: "POST",
    });
    if (!res.ok) {
      console.log("error");
      return;
    }
    await onChange();
  };
  const sublist = (title, books: t.Book[]) => {

  const items = books.map((book, index) => (
    <li key={book.bookid}>
      <ListItem
        link={`/book/${book.bookid}`}
        title={book.title}
        selected={book.bookid === selectedBookId}
        onDelete={() => deleteBook(book.bookid)}
        onFavorite={() => favoriteBook(book.bookid)}
      />
    </li>
  ));
  
    return <List key={title} title={title} items={items} level={2} className="p-0 m-0 border-0 text-lg pt-0 pl-0 pr-0 border-r-0 mb-sm" />
  }
  

  const favoriteBooks = books.filter((book) => book.favorite);
  const otherBooks = books.filter((book) => !book.favorite);

  const lists = [];

  if (favoriteBooks.length > 0) {
    lists.push(sublist("Favorites", favoriteBooks));
  }
  lists.push(sublist("All", otherBooks));

  const buttonStyles = "bg-sidebar hover:bg-sidebarSecondary dark:bg-dmsidebar dark:hover:bg-dmsidebarSecondary";  const buttonStylesDisabled = `${buttonStyles} disabled:opacity-50`
  const rightMenuItem = canCloseSidebar &&
    {
      label: "Close",
      icon: <XMarkIcon className="w-4 h-4" />,
      onClick: closeSidebar,
      className: buttonStyles
    };
  
    const leftMenuItem =
    { label: "New", icon: <PlusIcon className="w-4 h-4" />, onClick: newBook, className: buttonStyles }
  return <List title="Books" items={lists} rightMenuItem={
    rightMenuItem
  } leftMenuItem={leftMenuItem} className="bg-sidebar dark:bg-dmsidebar" />;

}
