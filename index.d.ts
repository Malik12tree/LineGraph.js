interface GraphStyleData {
	padding?: number,
	strokeWidth?: number,
	lineSize?: number,
	lineColor: String,
	strokeColor: String,
	fillColor: String,
}
interface GraphOnValueData {
	value: number,
	offset: number,
	index: number
}
interface GraphData {
	datapoints: number[],
	width?: number,
	height?: number,
	style?: GraphStyleData,
	/**
	 * Min & Max defines what values go on the bottom of the graph and what goes on the top ( respectively ).
	 * 
	 * If omitted, the minmax is computed by the set of datapoints.
	 */
	minmax?: [number, number],

	onValue(data: GraphOnValueData): void,
	onCancel(): void
}