import React from "react"
import MarkdownWithOverrides from "../components/MarkdownWithOverrides/MarkdownWithOverrides"
import components from "../../generated/components.js"
import { documentToReactComponents } from "@contentful/rich-text-react-renderer"
const docsToMarkdown = require("react-docs-markdown")

const defaultOverrides = {
  h1: props => <h2 {...props} />,
  h2: props => <h3 {...props} />,
  h3: props => <h4 {...props} />,
  h4: props => <h5 {...props} />,
  h5: props => <h6 {...props} />,
  a: props => <a {...props} target="_blank" />,
}

const ComponentDocumentation = props => {
  const {
    devDocs,
    designDocs,
    componentContext,
    propDocs,
    pkgJson,
    changelog,
  } = props.pageContext
  const { componentName } = componentContext

  const relatedComponents = []
  const namedComponents = {}

  // Checking if named component or default export as well if component relates to current documentation
  Object.keys(components).forEach(comp => {
    const isRelatedComponent = comp === componentName
    const currComp = components[comp]
    // if actual component, just add to namedComponents
    if (typeof currComp === "function") {
      namedComponents[comp] = currComp
      if (isRelatedComponent) {
        relatedComponents.push({ name: comp, isNamedExport: false })
      }
      return
    }

    // if a set of named exports, loop and add each one
    Object.keys(currComp).forEach(subComp => {
      if (isRelatedComponent) {
        relatedComponents.push({ name: subComp, isNamedExport: true })
      }
      namedComponents[subComp] = currComp[subComp]
    })
  })

  const MarkdownJsx = props => {
    const { overrides = [], children } = props
    return (
      <MarkdownWithOverrides
        overrides={{ ...defaultOverrides, ...namedComponents, ...overrides }}
      >
        {children}
      </MarkdownWithOverrides>
    )
  }

  const PropDocumentation = props => {
    const { name, allDocs } = props
    try {
      const foundDocumentation = Object.keys(allDocs).find(keyDoc => {
        const splitPath = keyDoc.split("/")
        const componentName = splitPath[splitPath.length - 1].replace(
          ".tsx",
          ""
        )
        return componentName === name
      })
      const docs = allDocs[foundDocumentation]

      return (
        <MarkdownJsx
          overrides={{
            h2: () => <h3>{name} Props</h3>,
          }}
        >
          {docsToMarkdown(docs)}
        </MarkdownJsx>
      )
    } catch (e) {
      return null
    }
  }

  return (
    <>
      <h1>{componentName}</h1>

      <p>Current Version: {pkgJson.version}</p>

      <p>
        <a
          href={`https://github.com/czaas/mb-design-system/tree/master/packages/${componentName}`}
          target="_blank"
        >
          GitHub Source
        </a>
      </p>

      <h2>Documentation</h2>
      {documentToReactComponents(designDocs)}

      <h3>Implementation Details</h3>

      <code>
        <pre>
          import{" "}
          {relatedComponents.map((component, index) => {
            const isFirst = index === 0
            const isLast = relatedComponents.length === index + 1
            const isNamedExport = component.isNamedExport

            const useOpenBracket = isNamedExport && isFirst
            const useClosingBracket = isNamedExport && isLast

            const useCommaSeparator = isNamedExport && !isLast

            return `${useOpenBracket ? "{ " : ""} ${component.name} ${
              useCommaSeparator ? ", " : ""
            } ${useClosingBracket ? " }" : ""}`
          })}{" "}
          from {pkgJson.name}
        </pre>
      </code>

      {relatedComponents.map(component => (
        <PropDocumentation
          key={component.name}
          name={component.name}
          allDocs={propDocs}
        />
      ))}

      <MarkdownJsx>{devDocs}</MarkdownJsx>

      <MarkdownJsx>{changelog}</MarkdownJsx>
    </>
  )
}
export default ComponentDocumentation
