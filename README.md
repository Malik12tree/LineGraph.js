# LineGraph.js
Create simple line graphs for viewing statistics

```js
const graph = new Graph({
    datapoints: [ -1 , 0 , 1 ],
    width: 200,
    height: 100,
    minmax: false,
    style: {
        strokeWidth: 1.5,
        lineSize: 1.5,
        padding: 0.88,
        lineColor: '#ff6996',
        strokeColor: '#ff6996',
        fillColor: '#ff699622'
    },
    onValue(data) {},
    onCancel() {}
});

document.body.append(graph.node);
```
* `datapoints: Number[]`
* `width?: Number`
* `height?: Number`
* `minmax?: Number[2]` Min & Max define what values go on the bottom of the graph and what goes on the top ( respectively ). If omitted, the minmax is computed by the set of datapoints.
* `style?: Object`
* `onValue?(data)`
* `onCancel?()`


The SVG utitily classes are a part of this project and not an external library
