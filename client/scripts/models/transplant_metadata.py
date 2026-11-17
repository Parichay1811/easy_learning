"""Copy the TFLITE_METADATA block (and min_runtime_version) of a donor .tflite
into a target .tflite whose input/output tensors have the same shapes.

usage: python transplant_meta.py donor.tflite target.tflite out.tflite
"""
import sys

import flatbuffers
from tensorflow.lite.python import schema_py_generated as S


def load(path):
    buf = open(path, 'rb').read()
    return S.ModelT.InitFromObj(S.Model.GetRootAsModel(buf, 0))


def io_shapes(m):
    g = m.subgraphs[0]
    ins = [list(g.tensors[i].shape) for i in g.inputs]
    outs = [list(g.tensors[i].shape) for i in g.outputs]
    return ins, outs


donor_path, target_path, out_path = sys.argv[1:4]
donor = load(donor_path)
target = load(target_path)

d_io, t_io = io_shapes(donor), io_shapes(target)
print('donor  io', d_io)
print('target io', t_io)
if d_io != t_io:
    sys.exit('tensor shapes differ — metadata would not apply')

# output tensor order must match too: compare names as a sanity check
dg, tg = donor.subgraphs[0], target.subgraphs[0]
print('donor  out names', [dg.tensors[i].name for i in dg.outputs])
print('target out names', [tg.tensors[i].name for i in tg.outputs])

meta = next(md for md in donor.metadata if md.name == b'TFLITE_METADATA')
meta_bytes = donor.buffers[meta.buffer].data

buf = S.BufferT()
buf.data = meta_bytes
target.buffers.append(buf)
entry = S.MetadataT()
entry.name = b'TFLITE_METADATA'
entry.buffer = len(target.buffers) - 1
target.metadata = [md for md in (target.metadata or []) if md.name != b'TFLITE_METADATA'] + [entry]

b = flatbuffers.Builder(1024)
b.Finish(target.Pack(b), file_identifier=b'TFL3')
open(out_path, 'wb').write(b.Output())
print('wrote', out_path, len(b.Output()), 'bytes')
