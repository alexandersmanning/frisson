import { syllable } from "syllable";
import React, { useState, useRef, useReducer, useEffect } from "react";
import produce, { current } from "immer";
import "./globals.css";
import TextEditor from "./TextEditor";
import Sidebar from "./Sidebar";
import InfoPanel from "./InfoPanel";
import { EditorState, State } from "./Types";
import Panel from "./components/Panel";
import SuggestionPanel from "./SuggestionPanel";
import { useParams } from "react-router-dom";
import * as t from "./Types";
import { useInterval } from "./utils";
import Settings from "./Settings";

const countSyllables = (text: string) => {
  try {
    return syllable(text);
  } catch (error) {
    console.error("Error counting syllables:", error);
    return 0;
  }
};

const reducer = produce((draft: t.State, action: any) => {
  switch (action.type) {
    case "setText":
      console.log("setText", action.payload);
      draft.editor.text = action.payload;
      draft.chapter.text = action.payload;
      break;
    case "setContents":
      console.log("setContents", action.payload);
      draft.editor.contents = action.payload;
      break;
    case "setChapter":
      draft.chapter = action.payload;
      break;
    case "setSuggestions":
      if (action.payload) {
        draft.suggestions = action.payload;
      }
      break;
    case "setSaved":
      console.log("setSaved", action.payload);
      draft.saved = action.payload;
      break;
    case "addToContents":
      if (!draft.editor.contents.insert) return;
      // console.log(current(draft.editor.contents));

      draft.editor.contents.insert(action.payload);
      draft.editor.text += action.payload;
      draft.saved = false;
      //draft.chapter.text += action.payload;
      break;
    case "setSynonyms":
      draft.synonyms = action.payload;
      break;
    case "clearSynonyms":
      draft.synonyms = [];
      break;
    case "setTooltipPosition":
      draft.editor.tooltipPosition = action.payload;
      break;
    case "openTooltip":
      draft.editor.tooltipOpen = true;
      break;
    case "closeTooltip":
      draft.editor.tooltipOpen = false;
      break;
    case "setSelectedText":
      draft.editor.selectedText = action.payload;
      break;
    case "synonymSelected":
      draft.editor.selectedText = action.payload;
      draft.editor.tooltipOpen = false;
      break;
    case "addExpandSuggestion":
      draft.suggestions.push({
        type: "expand",
        contents: action.payload,
      });
      break;

    case "addContractSuggestion":
      draft.suggestions.push({
        type: "contract",
        contents: action.payload,
      });
      break;

    case "addRewriteSuggestion":
      draft.suggestions.push({
        type: "rewrite",
        contents: action.payload,
      });
      break;
    case "addTextToSpeechSuggestion":
      draft.suggestions.push({
        type: "texttospeech",
        contents: action.payload,
      });
      break;
    case "fixPassiveVoiceSuggestion":
      draft.suggestions.push({
        type: "activevoice",
        contents: action.payload,
      });
      break;
  }
});

export default function Editor(
  {
    /*   book,
  setTitle,
  setText, */
  } /* : {
  book: t.Book;
  setTitle: (chapterID: string, newTitle: string) => void;
  setText: (chapterID: string, newText: string) => void;
} */
) {
  const { chapterid } = useParams();

  const [error, setError] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);

  useEffect(() => {
    const func = async () => {
      const res = await fetch(`/api/chapter/${chapterid}`);
      if (!res.ok) {
        setError(res.statusText);
        return;
      }
      const data: t.Chapter = await res.json();
      console.log("got chapter");
      console.log(data);
      dispatch({ type: "setChapter", payload: data });
      dispatch({ type: "setSuggestions", payload: data.suggestions });
      dispatch({ type: "setText", payload: data.text });
      setLoaded(true);
    };
    func();
  }, []);

  useInterval(() => {
    saveChapter(state);
  }, 5000);

  async function saveChapter(state: t.State) {
    if (state.saved) return;
    if (!state.chapter) {
      console.log("no chapter");
      return;
    }

    const chapter = { ...state.chapter };
    chapter.suggestions = state.suggestions;
    const body = JSON.stringify({ chapter });

    const result = await fetch("/api/saveChapter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (!result.ok) {
      setError(result.statusText);
      return;
    } else {
      setError("");
      dispatch({ type: "setSaved", payload: true });
    }
  }

  const initialEditorState: EditorState = {
    text: "",
    contents: {},
    tooltipPosition: { top: 0, left: 0 },
    tooltipOpen: false,
    selectedText: { index: 0, length: 0, contents: "" },
  };

  const initialState: State = {
    editor: initialEditorState,
    saved: true,
    chapterid,
    chapter: null,
    synonyms: [],
    infoPanel: { syllables: 0 },
    suggestions: [
      {
        type: "expand",
        contents:
          "In a faraway kingdom, there lived a vibrant young princess who was beloved by her people. Despite her royal wealth, not to mention her long flowing hair, the young princess felt trapped in the castle walls. She was desperate to explore the      ",
      },
    ],
  };

  const [state, dispatch] = useReducer<(state: State, action: any) => State>(
    reducer,
    initialState
  );

  let selectedSyllables = countSyllables(state.editor.selectedText.contents);

  const infoPanelState = {
    ...state.infoPanel,
    syllables: selectedSyllables,
  };

  const addToContents = (text: string) => {
    console.log({ text });
    console.log(state.editor.contents);
    dispatch({
      type: "addToContents",
      payload: text,
    });
  };

  if (!loaded) {
    if (error) {
      return <div>{error}</div>;
    }
    return <div>Loading...</div>;
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <div>
        <Sidebar>
          <a
            className="text-sm text-gray-500 m-sm"
            href={`/book/${state.chapter.bookid}`}
          >
            Back to book
          </a>
          <InfoPanel state={infoPanelState} />
          {state.suggestions.map((suggestion, index) => (
            <SuggestionPanel
              key={index}
              title={suggestion.type}
              contents={suggestion.contents}
              onClick={addToContents}
            />
          ))}
          <Settings />
        </Sidebar>
      </div>

      <div>
        <div className="flex flex-1 flex-col lg:pl-64 my-lg">
          <div className="py-md">
            <div className="mx-auto max-w-7xl px-sm lg:px-md mb-sm">
              <h1 className="text-2xl font-semibold text-gray-900">
                Your story{" "}
                {!state.saved && (
                  <span className="text-xs text-gray-500">
                    (unsaved changes)
                  </span>
                )}
              </h1>
            </div>
            <div className="mx-auto max-w-7xl px-sm lg:px-md">
              <TextEditor dispatch={dispatch as any} state={state.editor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
