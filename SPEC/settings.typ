#let apply-settings(body) = {
  set page(
    height: auto,
    margin: (rest: 1em, top: 1.5em, bottom: 1.5em, left: 2em, right: 2em),
    fill: white,
  )

  show heading: it => {
    let size = if it.level == 1 {
      20pt
    } else if it.level == 2 {
      14pt
    } else if it.level == 3 {
      12pt
    } else {
      10pt
    }

    v(0.75em)
    set text(size: size, weight: "bold", font: "UDEV Gothic 35LG")
    block(above: 1.75em, below: 1em)[#it]
  }

  set text(
    font: "UDEV Gothic 35LG",
    size: 9pt,
    lang: "ja",
    spacing: 0.05em,
  )

  set par(
    leading: 1.25em,
    justify: true,
    first-line-indent: 1em,
  )

  show heading.where(level: 1): it => [
    #stack(
      spacing: 1em,
      it,
      line(length: 100%, stroke: 1pt + black),
    )
    #v(1.5em)
  ]

  show heading.where(level: 2): it => [
    #stack(
      spacing: 0.75em,
      it,
      line(length: 90%, stroke: 0.5pt + gray),
    )
    #v(0.75em)
  ]

  show heading.where(level: 3): it => [
    #it
    #v(0.5em)
  ]

  show heading.where(level: 4): it => [
    #it
    #v(0.25em)
  ]

  body
}

