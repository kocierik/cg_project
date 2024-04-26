// Modulo per la generazione di montagne utilizzando il rumore di Perlin

var MountainGenerator = (function() {
    // Funzione privata: scala un valore da un intervallo a un altro
    function scaleRange(fromMin, fromMax, toMin, toMax) {
        return (toMax - toMin - 1) / (fromMax - fromMin - 1);
    }

    // Funzione privata: genera rumore casuale grezzo 2D
    function rawNoise2D(numPointsX, numPointsY, max) {
        numPointsX += 2;
        numPointsY += 2;
        var result = new Array(numPointsX);
        for (var i = 0; i < numPointsX; i++) {
            result[i] = new Array(numPointsY);
        }
        for (var x = 0; x < numPointsX; x++) {
            for (var y = 0; y < numPointsY; y++) {
                result[x][y] = Math.random() * max;
            }
        }
        return result;
    }

    // Funzione privata: applica un filtro di smoothing al rumore
    function smoothNoise2D(rawNoise) {
        var numPointsX = rawNoise.length - 2;
        var numPointsY = rawNoise[0].length - 2;
        var result = new Array(numPointsX);
        for (var i = 0; i < numPointsX; i++) {
            result[i] = new Array(numPointsY);
        }
        for (var x = 1; x < numPointsX + 1; x++) {
            for (var y = 1; y < numPointsY + 1; y++) {
                var corners = (rawNoise[x - 1][y - 1] + rawNoise[x + 1][y - 1] + rawNoise[x - 1][y + 1] + rawNoise[x + 1][y + 1]) / 16;
                var sides = (rawNoise[x - 1][y] + rawNoise[x + 1][y] + rawNoise[x][y - 1] + rawNoise[x][y + 1]) / 8;
                var center = rawNoise[x][y] / 4;
                result[x - 1][y - 1] = corners + sides + center;
            }
        }
        return result;
    }

    // Funzione privata: interpolazione bilineare
    function bilinearInterpolate(x, y, s) {
        var x0 = Math.floor(x);
        var y0 = Math.floor(y);
        var x1 = Math.ceil(x);
        var y1 = Math.ceil(y);
        if (x == 0) {
            x1 += 1;
        }
        if (y == 0) {
            y1 += 1;
        }
        var q00 = s[x0 + 1][y0 + 1];
        var q01 = s[x0 + 1][y1 + 1];
        var q10 = s[x1 + 1][y0 + 1];
        var q11 = s[x1 + 1][y1 + 1];
        return q00 / ((x1 - x0) * (y1 - y0)) * (x1 - x) * (y1 - y) +
            q10 / ((x1 - x0) * (y1 - y0)) * (x - x0) * (y1 - y) +
            q01 / ((x1 - x0) * (y1 - y0)) * (x1 - x) * (y - y0) +
            q11 / ((x1 - x0) * (y1 - y0)) * (x - x0) * (y - y0);
    }

    // Funzione pubblica: genera una mesh di montagna con normali utilizzando il rumore di Perlin
    function generateMountain(scale, sizeX, sizeY, noiseSizeX, noiseSizeY, maxHeight) {
        return mountain2(scale, sizeX, sizeY, noiseSizeX, noiseSizeY, maxHeight);
    }

    // Funzione privata: genera la mesh della montagna e le normali
    function mountain2(scale, sizeX, sizeY, noiseSizeX, noiseSizeY, maxHeight) {
        var vertices = new Array(sizeX);
        for (var i = 0; i < sizeY; i++) {
            vertices[i] = new Array(sizeY);
        }
        var noise = rawNoise2D(Math.floor(2 + noiseSizeX), Math.floor(2 + noiseSizeY), maxHeight);
        noise = smoothNoise2D(noise);
        for (var x = 0; x < sizeX; x++) {
            for (var y = 0; y < sizeY; y++) {
                var samplex = x * scaleRange(0, sizeX - 1, 0, (noiseSizeX - 2));
                var sampley = y * scaleRange(0, sizeY - 1, 0, (noiseSizeY - 2));
                var sample = bilinearInterpolate(samplex, sampley, noise);
                var xcoord = scale / sizeX * x;
                var ycoord = scale / sizeY * y;
                var zcoord = sample;
                vertices[x][y] = [xcoord, ycoord, zcoord];
            }
        }
        var mesh = [];
        var normals = [];
        for (var x = 0; x < sizeX - 1; x++) {
            for (var y = 0; y < sizeY - 1; y++) {
                var v1 = vec3.create(vertices[x][y]);
                var v2 = vec3.create(vertices[x + 1][y]);
                var v3 = vec3.create(vertices[x][y + 1]);
                var v4 = vec3.create(vertices[x + 1][y + 1]);
                var top = vec3.create();
                vec3.subtract(v2, v1, top);
                var left = vec3.create();
                vec3.subtract(v1, v3, left);
                var bottom = vec3.create();
                vec3.subtract(v4, v3, bottom);
                var right = vec3.create();
                vec3.subtract(v4, v2, right);
                mesh.push(v1[0], v1[1], v1[2]);
                mesh.push(v2[0], v2[1], v2[2]);
                mesh.push(v3[0], v3[1], v3[2]);
                var normal = vec3.create();
                vec3.cross(left, top, normal);
                vec3.normalize(normal);
                normals.push(normal[0], normal[1], normal[2]);
                normals.push(normal[0], normal[1], normal[2]);
                normals.push(normal[0], normal[1], normal[2]);
                mesh.push(v3[0], v3[1], v3[2]);
                mesh.push(v2[0], v2[1], v2[2]);
                mesh.push(v4[0], v4[1], v4[2]);
                normal = vec3.create();
                vec3.cross(bottom, right, normal);
                vec3.normalize(normal);
                normals.push(normal[0], normal[1], normal[2]);
                normals.push(normal[0], normal[1], normal[2]);
                normals.push(normal[0], normal[1], normal[2]);
            }
        }
        // console.log("mesh --> ", mesh)
        // console.log("normals --> ", normals)
        
        return [mesh, normals];
    }

    // Ritorna le funzioni pubbliche
    return {
        generateMountain: generateMountain
    };
})();
