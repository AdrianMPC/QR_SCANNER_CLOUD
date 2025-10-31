import React, { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardAdmin() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchAsistencias = async () => {
      const { data: rows, error } = await supabase
        .from("asistencias")
        .select("estado, evento_id");
      if (!error && rows) {
        const grouped = rows.reduce((acc, r) => {
          acc[r.estado] = (acc[r.estado] || 0) + 1;
          return acc;
        }, {});
        setData(Object.entries(grouped).map(([estado, count]) => ({ estado, count })));
      }
    };
    fetchAsistencias();
  }, []);

  return (
    <div className="dashboard">
      <h2> Resumen general de asistencia</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="estado" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#004FB7" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
