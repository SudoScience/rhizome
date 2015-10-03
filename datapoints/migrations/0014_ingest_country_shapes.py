# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import os
import json

from urllib2 import Request, urlopen
from urllib import urlencode
from pprint import pprint

from django.db import models, migrations, IntegrityError
from django.core.exceptions import ObjectDoesNotExist
from django.core.exceptions import ValidationError
from titlecase import titlecase

from datapoints.models import Location, LocationPolygon, LocationType
from source_data.models import SourceObjectMap

ROOT_URL = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries/'



def ingest_geo(apps, schema_editor):

    GEO_JSON_DIR = '/Users/john/data/geo'

    # lebanon, turkey, iraq, jordan


    location_codes  = ['JOR','IRQ','TUR','SYR','LBN']
    for loc in location_codes:
        x = '%s.geo.json' % loc

    # for x in range(0,3):
    process_geo_json_url(x)

def process_geo_json_url(data_to_fetch):

    request_url = ROOT_URL + data_to_fetch
    response = urlopen(request_url)
    geo_json = json.loads(response.read())

    pprint(geo_json)

    process_location(geo_json,0)

    # print '\n PROCESSING: %s'  % file_path
    #
    # with open(file_path) as data_file:
    #     data = json.load(data_file)
    #
    # features = data['features']
    # process_location(feature,lvl)

def process_location(geo_json, lvl):
    '''
    '''

    features = geo_json['features'][0]

    location_code = features['id']
    location_name = titlecase(features['properties']['name'])

    location_type = LocationType.objects.get(admin_level = 0)

    err, location_id = create_new_location(lvl, features, location_name,location_code)

    try:
        rp, created = LocationPolygon.objects.get_or_create(
            location_id = location_id,
            defaults = {'geo_json': features}
        )
    except ValidationError:
        print 'ValidationError!!'

    ## now create a mapping if it doesnt exists already ##
    som_obj, created = SourceObjectMap.objects.get_or_create(
        content_type = 'location',
        source_object_code = location_code,
        defaults = {'mapped_by_id':1,'master_object_id':location_id}
    )

def create_new_location(lvl, geo_json,location_name, location_code):

    new_location = Location.objects.create(
        location_code = location_code,
        name = location_name,
        location_type_id = lvl + 1,
        slug =  location_code,
        parent_location_id = None,
        office_id = 1,
    )

    return None, new_location.id


class Migration(migrations.Migration):

    dependencies = [
    # DELETE FROM django_migrations WHERE name = '0013_ingest_geojson';
        ('datapoints', '0013_clean_doc_table'),
    ]

    operations = [
        migrations.RunPython(ingest_geo)
    ]
