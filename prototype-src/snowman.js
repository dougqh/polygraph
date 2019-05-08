
// sky
svg.rect({
  x: 0, y: 0,
  width: 1000, height: 400,
  fill: 'blue'
});

// ground
svg.rect({
  x: 0, y: 400,
  width: 1000, height: 200,
  fill: 'tan'
});

// snowman body
svg.g().translate([180, 150]).contents(() => {
  svg.circle({
    cx: 0, cy: 350, r: 120,
    fill: 'white',
    stroke: 'black', strokeWidth: '1px'
  });
 
  svg.circle({
    cx: 0, cy: 190, r: 100,
    fill: 'white',
    stroke: 'black', strokeWidth: '1px'
  });
 
  // head
  svg.circle({
    cx: 0, cy: 50, r: 80,
    fill: 'white',
    stroke: 'black', strokeWidth: '1px'
  });

  svg.circle({
    cx: -20, cy: 25, r: 20,
    fill: 'white',
    stroke: 'black', strokeWidth: '1px'
  });
  svg.circle({cx: -20, cy: 35, r: 5, fill: 'black'});

  svg.circle({
    cx: +60, cy: 25, r: 20,
    fill: 'white',
    stroke: 'black', strokeWidth: '1px'
  });
  svg.circle({cx: +60, cy: 35, r: 5, fill: 'black'});

  svg.circle({
    cx: +20, cy: 75, r: 20,
    fill: 'red',
    stroke: 'black', strokeWidth: '1px'
  });
});

  
// tree
svg.g().translate(700, 100).contents(() => {
  svg.rect({
    x: 0, y: 0,
    width: 100, height: 400,
    fill: 'brown',
    stroke: 'black', strokeWidth: '1px'
  });

  svg.circle({
    cx: 50, cy: 0, r: 175,
    fill: 'green',
    stroke: 'black', strokeWidth: '1px'
  });
});

svg.polyline([[20, 20], [60, 40], [80, 20], [100, 40]]).rotate(45).class_('squiggle');

svg.text({x: 500, y: 500}, 'Hello World!');