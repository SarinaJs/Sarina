interface Array<T> {
	pushRange(array: Array<T>);
	clear();
	clone();
	contains(item: T);
	copyTo(target: Array<T>, arrayIndex?: number, length?: number);
	remove(item: T | number);
	removeRange(arrayIndex: number, length?: number);
	count(
		predicate: (this: void, value: T, index: number, obj: T[]) => boolean
	): number;
}
Array.prototype.pushRange = function<T>(array: Array<T>) {
	let arr = this as Array<T>;
	Array.prototype.push.apply(arr, array);
};
Array.prototype.clear = function<T>() {
	let arr = this as Array<T>;
	arr.splice(0, this.length);
};
Array.prototype.clone = function<T>() {
	let arr = this as Array<T>;
	let newArr = [];
	arr.copyTo(newArr);
};
Array.prototype.contains = function<T>(item: T) {
	let arr = this as Array<T>;
	return arr.indexOf(item) !== -1;
};
Array.prototype.copyTo = function<T>(
	target: Array<T>,
	arrayIndex: number = null,
	length: number = null
) {
	let arr = this as Array<T>;
	target.pushRange(arr.slice(arrayIndex || 0, length || arr.length));
};
Array.prototype.remove = function<T>(item: T) {
	let arr = this as Array<T>;
	let items = arr.filter(_item => _item === item);
	items.forEach(_item => {
		let index = arr.indexOf(_item);
		if (index !== -1) arr.splice(index, 1);
	});
};
Array.prototype.remove = function<T>(item: T) {
	let arr = this as Array<T>;

	if (typeof item === "number") {
		arr.splice(item, 1);
	} else {
		let items = arr.filter(_item => _item === item);
		items.forEach(_item => {
			let index = arr.indexOf(_item);
			if (index !== -1) arr.splice(index, 1);
		});
	}
};
Array.prototype.removeRange = function<T>(arrayIndex: number, length?: number) {
	let arr = this as Array<T>;
	arr.splice(arrayIndex, length || arr.length);
};
Array.prototype.count = function<T>(
	predicate: (this: void, value: T, index: number, obj: T[]) => boolean
) {
	let arr = this as Array<T>;
	return arr.filter(predicate).length;
};
