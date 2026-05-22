import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";


// Fix default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: ("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: ("leaflet/dist/images/marker-icon.png"),
  shadowUrl: ("leaflet/dist/images/marker-shadow.png"),
});

export default function ReportsMap({ reports }: { reports: any[] }) {
  return (
    <MapContainer
      center={[10.67, 122.95]} // Default center (can be dynamic)
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {reports.map((report) =>
        report.lat && report.lng ? (
          <Marker key={report.id} position={[report.lat, report.lng]}>
            <Popup>
              <strong>{report.description}</strong>
              <br />
              Status: {report.status}
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}
