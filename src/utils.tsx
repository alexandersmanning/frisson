import React, { useRef, useEffect, useState, SetStateAction } from "react";
import * as JsDiff from "diff";
import { useDispatch, useSelector } from "react-redux";
import * as fd from "./fetchData";
import { RootState } from "./store";
import { librarySlice } from "./reducers/librarySlice";
import * as t from "./Types";
import { Dispatch, AnyAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

export function useInterval(fn: any, delay: any) {
  const saved = useRef();
  useEffect(() => {
    saved.current = fn;
  }, [fn]);

  useEffect(() => {
    function tick() {
      if (saved && saved.current) {
        // @ts-ignore
        saved.current();
      }
    }
    const interval = setInterval(() => {
      tick();
    }, delay);
    return () => {
      clearInterval(interval);
    };
  }, [delay]);
}

export function localStorageOrDefault(key: string, defaultValue: any) {
  const value = localStorage.getItem(key);
  if (value === null) {
    return defaultValue;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

// Hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };
  return [storedValue, setValue] as const;
}

export const fetchSuggestionsWrapper = async (
  settings: {
    model: any;
    max_tokens: any;
    num_suggestions: any;
    theme?: "default";
    version_control?: boolean;
    prompts?: t.Prompt[];
  },
  setLoading: {
    (value: SetStateAction<boolean>): void;
    (bool: any): void;
    (arg0: boolean): void;
  },
  onLoad: { (): void; (): void; (): void },
  prompt: string,
  label: string,
  text: string,
  dispatch: Dispatch<AnyAction>
) => {
  const _max_tokens = parseInt(settings.max_tokens, 10) || 1;
  const _num_suggestions = parseInt(settings.num_suggestions, 10) || 1;

  const max_tokens_with_min = Math.min(_max_tokens, 500);

  setLoading(true);
  const result = await fd.fetchSuggestions(
    text,
    settings.model,
    _num_suggestions,
    max_tokens_with_min,
    prompt,
    label
  );
  setLoading(false);

  if (result.tag === "error") {
    dispatch(librarySlice.actions.setError(result.message));
    return;
  }

  result.payload.forEach((choice: { text: any }) => {
    const generatedText = choice.text;
    dispatch(
      librarySlice.actions.addSuggestion({ label, value: generatedText })
    );
  });
  dispatch(librarySlice.actions.setSuggestions(false));

  onLoad();
};

export function split(text: string) {
  let parts = text.replaceAll("\n", "\n ").split(" ");
  parts = parts.filter((part: string) => part !== "");
  return parts;
}

export function normalize(word: string) {
  return word.toLowerCase().replace(/[^a-z ]/g, "");
}

export function findSubarray(array: any[], subarray: any[]) {
  const subarrayLength = subarray.length;
  for (let i = 0; i < array.length; i++) {
    if (array.slice(i, i + subarrayLength).join(" ") === subarray.join(" ")) {
      return i;
    }
  }
  return -1;
}

export function getCsrfToken() {
  const token = document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute("content");
  return token;
}

export function parseText(text: string): t.TextBlock[] {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      if (!data[0].id) {
        data.forEach((block: t.TextBlock, index: number) => {
          block.id = nanoid();
        });
      }
      return data;
    }
    return [t.plainTextBlock(text)];
  } catch (e) {
    return [t.plainTextBlock(text)];
  }
}

export function isString(x): boolean {
  return typeof x === "string" || x instanceof String;
}

export function strSplice(
  str: string,
  index: number,
  count: number,
  add = ""
): string {
  return str.slice(0, index) + (add || "") + str.slice(index + count);
}

export function useTraceUpdate(props) {
  const prev = useRef(props);
  useEffect(() => {
    const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
      if (prev.current[k] !== v) {
        ps[k] = [prev.current[k], v];
      }
      return ps;
    }, {});
    if (Object.keys(changedProps).length > 0) {
      console.log("Changed props:", changedProps);
    }
    prev.current = props;
  });
}

export function getChapterText(chapter) {
  return chapter.text.map((t) => t.text).join("\n---\n");
}

type Diff = {
  value: string;
  added?: boolean;
  removed?: boolean;
};
function makeDiff(value, type: "added" | "removed" | "same"): Diff[] {
  const obj: Diff = {
    value,
  };
  if (type === "added") {
    obj.added = true;
  }
  if (type === "removed") {
    obj.removed = true;
  }
  return [obj];
}

export function getHtmlDiff(originalText, newText) {
  let diff: Diff[] = [];
  if (originalText === "") {
    diff = makeDiff(newText, "added");
  } else if (newText === "") {
    diff = makeDiff(originalText, "removed");
  } else if (originalText === newText) {
    diff = makeDiff(originalText, "same");
  } else {
    diff = JsDiff.diffWordsWithSpace(originalText, newText);
  }
  const originalLines = [];
  const newLines = [];

  let key = 0;
  diff.forEach((part) => {
    const lines = part.value.split("\n");

    for (let i = 0; i < lines.length; i++) {
      key += 1;
      if (i === lines.length - 1 && lines[i] === "") {
        continue; // Skip the last empty line
      }

      if (part.added) {
        originalLines.push("");
        newLines.push(
          <span key={key} className="bg-green-300 dark:bg-green-700">
            {lines[i]}
          </span>
        );
      } else if (part.removed) {
        originalLines.push(
          <span key={key} className="bg-red-300 dark:bg-red-700">
            {lines[i]}
          </span>
        );
        newLines.push("");
      } else {
        originalLines.push(<span key={key}>{lines[i]}</span>);
        newLines.push(<span key={key}>{lines[i]}</span>);
      }

      if (i < lines.length - 1) {
        originalLines.push(<br />);
        newLines.push(<br />);
      }
    }
  });

  return { originalLines, newLines };
}
