import * as Diff from "diff";
import React, { useState, useEffect } from "react";
import { produce } from "immer";
import Button from "./components/Button";
import Input from "./components/Input";
import Select from "./components/Select";
import * as t from "./Types";
import { PencilIcon, TagIcon } from "@heroicons/react/24/solid";
import Panel from "./components/Panel";

const History = ({ bookid, chapterid, onSave, triggerHistoryRerender, onClick }) => {
  const [history, setHistory] = useState<t.History>([]);
console.log("rerendering history");
  useEffect(() => {
    const func = async () => {
      const res = await fetch(`/api/getHistory/${bookid}/${chapterid}`, {
        credentials: "include",
      });
      if (!res.ok) {
        console.log(res.statusText);
        //dispatch({ type: "setError", payload: res.statusText });
        return;
      }
      const data = await res.json();
      console.log("got history");
      console.log(data);
      setHistory(data);
    };
    func();
  }, [triggerHistoryRerender]);

const applyPatch = (index) => {
  if (index < 0) return "";
  if (!history || !history[index]) return "";
  let old = history[0];
  if (index === 0) return old;
  
  history.slice(1, index+1).forEach((patch) => {
    console.log("old", old);
    console.log("patch", patch);
    const result = Diff.applyPatch(old, patch);
    console.log("result", result);
    if (result) old = result;
  });
  return old;
}

const reverseHistory = [...history].reverse();
  return (
    <div className="grid grid-cols-1 gap-3">
      {reverseHistory.map((patch, i) => (
        <Panel key={i} title="History" onClick={
          (e) => {
            e.stopPropagation();
            // account for history being reversed
            const newText = applyPatch(history.length - i);
            onClick(newText);
          }

        }
        className= "cursor-pointer"
        >
          <pre className="text-xs xl:text-sm">{patch}</pre>
        </Panel>
      ))}
    </div>
  );
};

export default History;
