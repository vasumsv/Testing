import{j as e}from"./index-P0itqdt5.js";import{r as x}from"./react-vendor-B6KbklQe.js";const i=x.forwardRef(({label:t,error:s,hint:a,prefix:r,suffix:l,className:d="",...n},o)=>e.jsxs("div",{className:"flex flex-col gap-1.5",children:[t&&e.jsxs("label",{className:"text-[0.8125rem] font-medium text-ink leading-none",children:[t,n.required&&e.jsx("span",{className:"text-danger ml-1",children:"*"})]}),e.jsxs("div",{className:"relative flex items-center",children:[r&&e.jsx("div",{className:"absolute left-3 text-ink-subtle pointer-events-none flex items-center",children:r}),e.jsx("input",{ref:o,className:`
            w-full h-9 bg-white border border-border rounded-md px-3 text-sm text-ink
            placeholder:text-ink-subtle/50
            outline-none
            hover:border-slate-400/50
            transition-[border-color,box-shadow] duration-150
            focus:border-slate-900 focus:[box-shadow:0_0_0_3px_rgba(15,23,42,0.07)]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-raised
            ${s?"border-danger focus:border-danger focus:[box-shadow:0_0_0_3px_rgba(239,68,68,0.10)]":""}
            ${r?"pl-9":""}
            ${l?"pr-9":""}
            ${d}
          `,...n}),l&&e.jsx("div",{className:"absolute right-3 text-ink-subtle flex items-center",children:l})]}),s&&e.jsx("p",{className:"text-xs text-danger",children:s}),a&&!s&&e.jsx("p",{className:"text-xs text-ink-subtle",children:a})]}));i.displayName="Input";function b({label:t,error:s,hint:a,children:r,className:l="",...d}){return e.jsxs("div",{className:"flex flex-col gap-1.5",children:[t&&e.jsxs("label",{className:"text-[0.8125rem] font-medium text-ink leading-none",children:[t,d.required&&e.jsx("span",{className:"text-danger ml-1",children:"*"})]}),e.jsx("select",{className:`
          w-full h-11 sm:h-9 bg-white border border-border rounded-md px-3 text-sm text-ink
          outline-none cursor-pointer
          hover:border-slate-400/50
          transition-[border-color,box-shadow] duration-150
          focus:border-slate-900 focus:[box-shadow:0_0_0_3px_rgba(15,23,42,0.07)]
          ${s?"border-danger":""}
          ${l}
        `,...d,children:r}),s&&e.jsx("p",{className:"text-xs text-danger",children:s}),a&&!s&&e.jsx("p",{className:"text-xs text-ink-subtle",children:a})]})}export{i as I,b as S};
