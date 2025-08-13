from flask import Flask, request, render_template, jsonify
from allergen_density import handle_sent_coords, unique_trees

app = Flask(__name__)

@app.route('/')
def form():
    return render_template('results.html', trees=unique_trees)

@app.route('/update_coords', methods=['POST'])
def update_coords():
    coords_json = request.get_json()
    lat = coords_json.get('latitude')
    lon = coords_json.get('longitude')
    coords= [lat,lon]
    print('update_coords() received coords:', coords)
    density_by_tree = handle_sent_coords(coords)
    return jsonify(density_by_tree.to_dict(orient='index'))


if __name__ == '__main__':
    app.run(debug=False)